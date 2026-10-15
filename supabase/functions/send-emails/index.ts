// Welcome emails (every 15 minutes) and the weekly digest (Mondays), sent
// through Resend. Called by pg_cron with the shared cron secret and a body of
// {"kind":"welcome"} or {"kind":"digest"}. Needs the RESEND_API_KEY secret.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = "https://www.reptilytics.com";
const FROM = "Reptilytics <info@reptilytics.com>";
const BATCH = 50;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Paper = { title: string; url: string };
type SpeciesPapers = { common_name: string | null; scientific_name: string; count: number; top: Paper[] };
type Due = { name: string; days: number };

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return Response.json({ skipped: "RESEND_API_KEY is not set" });

  const { kind } = await req.json().catch(() => ({ kind: null }));
  if (kind === "welcome") return Response.json(await sendWelcomes(key));
  if (kind === "digest") return Response.json(await sendDigests(key));
  return Response.json({ error: "kind must be welcome or digest" }, { status: 400 });
});

async function sendWelcomes(key: string) {
  const { data, error } = await admin.rpc("fn53_pending_welcomes", { p_limit: BATCH });
  if (error) return { error: error.message };
  let sent = 0;
  for (const u of data ?? []) {
    const hi = u.display_name ? `Hi ${esc(u.display_name)},` : "Hi,";
    const html = layout(`
      <p>${hi}</p>
      <p>Welcome to Reptilytics. Three things get you set up:</p>
      <ol>
        <li><a href="${SITE}/animals/new">Add your first animal</a>: name, species, sex and hatch date.</li>
        <li><a href="${SITE}/enclosures/new">Set up an enclosure</a> with its temperatures and gear.</li>
        <li>Set a feeding interval on each animal, and we'll flag who's due to eat.</li>
      </ol>
      <p>Free tools while you're here: the <a href="${SITE}/genetics">morph genetics calculator</a>,
      <a href="${SITE}/tools">prey size, hatch date and enclosure size calculators</a>, and the
      <a href="${SITE}/research">research library</a>.</p>
      <p>Something missing or broken? Just reply to this email.</p>`);
    if (await send(key, u.email, "Welcome to Reptilytics", html)) {
      await admin.rpc("fn54_mark_emailed", { p_user_id: u.user_id, p_kind: "welcome" });
      sent++;
    }
  }
  return { kind: "welcome", candidates: data?.length ?? 0, sent };
}

async function sendDigests(key: string) {
  const { data, error } = await admin.rpc("fn55_digest_batch", { p_limit: BATCH });
  if (error) return { error: error.message };
  let sent = 0;
  let quiet = 0;
  for (const u of data ?? []) {
    const due = (u.due ?? []) as Due[];
    const papers = (u.papers ?? []) as SpeciesPapers[];
    // Nothing to say: skip this week rather than send an empty email.
    if (!due.length && !papers.length) {
      await admin.rpc("fn54_mark_emailed", { p_user_id: u.user_id, p_kind: "digest" });
      quiet++;
      continue;
    }
    const unsubscribe = `${SITE}/unsubscribe?t=${u.email_token}`;
    const sections: string[] = [];
    if (due.length) {
      sections.push(`
        <h2 style="font-size:16px;margin:24px 0 8px">Due to eat</h2>
        <ul>${due.map((d) => `<li>${esc(d.name)}: ${dueLabel(d.days)}</li>`).join("")}</ul>
        <p><a href="${SITE}/animals">Open My animals</a></p>`);
    }
    for (const s of papers) {
      const name = s.common_name || s.scientific_name;
      sections.push(`
        <h2 style="font-size:16px;margin:24px 0 8px">New research: ${esc(name)}</h2>
        <p>${s.count} new paper${s.count === 1 ? "" : "s"} this week${s.count > s.top.length ? ", including" : ""}:</p>
        <ul>${s.top.map((p) => `<li><a href="${esc(p.url)}">${esc(p.title)}</a></li>`).join("")}</ul>
        <p><a href="${SITE}/species/${slugify(name)}/research">All ${esc(name)} research</a></p>`);
    }
    const subject = due.length
      ? `${due.length} ${due.length === 1 ? "animal is" : "animals are"} due to eat`
      : `New research for your ${papers.length === 1 ? (papers[0].common_name || papers[0].scientific_name).toLowerCase() : "species"}`;
    const html = layout(
      `<p>${u.display_name ? `Hi ${esc(u.display_name)},` : "Hi,"} here's your week.</p>${sections.join("")}`,
      `<a href="${unsubscribe}" style="color:#888">Unsubscribe from the weekly digest</a> or change it in <a href="${SITE}/settings" style="color:#888">Settings</a>.`,
    );
    if (await send(key, u.email, subject, html, unsubscribe)) {
      await admin.rpc("fn54_mark_emailed", { p_user_id: u.user_id, p_kind: "digest" });
      sent++;
    }
  }
  return { kind: "digest", candidates: data?.length ?? 0, sent, quiet };
}

async function send(key: string, to: string, subject: string, html: string, unsubscribe?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to,
      reply_to: "info@reptilytics.com",
      subject,
      html,
      ...(unsubscribe && {
        headers: { "List-Unsubscribe": `<${unsubscribe.replace("/unsubscribe?", "/api/unsubscribe?")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
    }),
  });
  if (!res.ok) console.error(`Resend ${res.status}: ${await res.text()}`);
  return res.ok;
}

function layout(body: string, footer = "") {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px;margin:0 auto;padding:16px">
    <p style="font-weight:700;font-size:18px;margin:0 0 16px">Reptilytics</p>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#888">Reptilytics · <a href="${SITE}" style="color:#888">reptilytics.com</a>${footer ? `<br>${footer}` : ""}</p>
  </div>`;
}

function dueLabel(days: number) {
  if (days < 0) return `overdue ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "due today";
  return "due tomorrow";
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Same as slugify in apps/web/src/lib/slug.ts.
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
