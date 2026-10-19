// Welcome emails (every 15 minutes), the weekly digest (Mondays) and one-off
// emails from Admin → Email ("outbox"), sent through Resend. Called with the
// shared cron secret and a body of {"kind":"welcome" | "digest" | "outbox" | "opens" | "transfers"}.
// "transfers" tells keepers an animal is waiting for them, or that someone
// shared an animal with them (every 5 minutes).
// "opens" refreshes open status of recent outbox emails (every 30 minutes).
// Needs the RESEND_API_KEY secret.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = "https://www.reptilytics.com";
const FROM = "Reptilytics <info@reptilytics.com>";
const BATCH = 50;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Paper = { title: string; url: string };
type SpeciesPapers = { species_id: string; common_name: string | null; scientific_name: string; count: number; top: Paper[] };
type Due = { name: string; days: number };

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return Response.json({ skipped: "RESEND_API_KEY is not set" });

  const { kind } = await req.json().catch(() => ({ kind: null }));
  if (kind === "welcome") return Response.json(await sendWelcomes(key));
  if (kind === "digest") return Response.json(await sendDigests(key));
  if (kind === "outbox") return Response.json(await sendOutbox(key));
  if (kind === "opens") return Response.json(await refreshOpens(key));
  if (kind === "transfers") return Response.json({ ...(await sendTransfers(key)), shares: await sendShares(key) });
  return Response.json({ error: "kind must be welcome, digest, outbox, opens or transfers" }, { status: 400 });
});

async function sendWelcomes(key: string) {
  const { data, error } = await admin.rpc("fn53_pending_welcomes", { p_limit: BATCH });
  if (error) return { error: error.message };
  let sent = 0;
  for (const u of data ?? []) {
    const hi = u.display_name ? `Hi ${esc(u.display_name)},` : "Hi,";
    const h = (text: string) => `<h2 style="font-size:16px;margin:28px 0 8px">${text}</h2>`;
    const html = layout(`
      <p>${hi}</p>
      <p>Welcome to Reptilytics, and thanks for joining. Reptilytics is a home for your reptile and amphibian records:
      every feeding, weight, shed and enclosure reading in one place, with the patterns pulled out for you so you can
      spot a problem early and see how your animals are really doing.</p>

      ${h("Get set up in ten minutes")}
      <ol style="padding-left:20px">
        <li style="margin-bottom:8px"><a href="${SITE}/animals/new"><strong>Add your first animal.</strong></a>
          Name, species, sex and hatch date are enough to start. Add morph genes from our species lists and Reptilytics
          builds the morph name for you; add sire and dam and the family tree builds itself.</li>
        <li style="margin-bottom:8px"><a href="${SITE}/enclosures/new"><strong>Set up its enclosure.</strong></a>
          Enter target basking, hot-side and cool-side temperatures and humidity, then log readings as you check them.
          Add the gear you use (heat source, thermostat, UVB) so you have a record when something changes.</li>
        <li style="margin-bottom:8px"><strong>Set a feeding interval.</strong> On each animal's page, tell us how often it
          eats, and we'll flag who's due or overdue on your dashboard.</li>
        <li><strong>Log as you go.</strong> Feedings (including refusals), weights and sheds take a few seconds each,
          and they're what turn into growth charts and early warnings.</li>
      </ol>

      ${h("What you'll get")}
      <ul style="padding-left:20px">
        <li style="margin-bottom:6px"><strong>A weekly digest</strong> on Mondays: who's due to eat, and new research
          for the species you keep. You choose what it includes in <a href="${SITE}/settings">Settings</a>.</li>
        <li style="margin-bottom:6px"><strong>Growth and history</strong> for every animal: weight charts, feeding
          history, shed records and a full timeline you can share with a vet or a buyer.</li>
        <li style="margin-bottom:6px"><strong>Species pages</strong> with care facts, published research and natural
          history notes from the herpetological literature, each linked to its source.</li>
        <li style="margin-bottom:6px"><strong>Breeding records</strong>: pairings, clutches, eggs and incubation, with
          hatchlings that inherit their parents' lineage and genetics.</li>
        <li><strong>Clean hand-offs</strong>: when an animal changes hands, transfer it to the new keeper with its
          whole history.</li>
      </ul>
      <p>Free tools while you're here: the <a href="${SITE}/genetics">morph genetics calculator</a>, the
      <a href="${SITE}/tools">prey size, hatch date and enclosure size calculators</a>, and the
      <a href="${SITE}/research">research library</a>.</p>

      ${h("Your records are yours")}
      <p>Your animals are private unless you choose to make one public. Community comparisons only ever use anonymous
      totals, and only once enough keepers contribute that no one can be identified.</p>

      ${h("Help spread the word")}
      <p>Reptilytics gets better with every keeper who joins: the growth and care comparisons come from the community,
      so the more keepers log, the more everyone learns. If you know other keepers, breeders or a local herp society,
      forward this email or share <a href="${SITE}">reptilytics.com</a> with them. It's free for them too.</p>

      <p style="margin-top:28px">Something missing, confusing or broken? Just reply to this email. Every message is
      read by a person, and keeper feedback decides what we build next.</p>
      <p>Happy herping,<br>The Reptilytics Team</p>`);
    if ((await send(key, u.email, "Welcome to Reptilytics", html)).ok) {
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
    const stop = (what: string, label: string, species?: string) =>
      `<p style="font-size:12px;margin:4px 0 0"><a href="${unsubscribe}&amp;what=${what}${species ? `&amp;s=${species}` : ""}" style="color:#888">${label}</a></p>`;
    const sections: string[] = [];
    if (due.length) {
      sections.push(`
        <h2 style="font-size:16px;margin:24px 0 8px">Due to eat</h2>
        <ul>${due.map((d) => `<li>${esc(d.name)}: ${dueLabel(d.days)}</li>`).join("")}</ul>
        <p><a href="${SITE}/animals">Open My animals</a></p>
        ${stop("feeding", "Stop feeding reminders")}`);
    }
    for (const s of papers) {
      const name = s.common_name || s.scientific_name;
      sections.push(`
        <h2 style="font-size:16px;margin:24px 0 8px">New research: ${esc(name)}</h2>
        <p>${s.count} new paper${s.count === 1 ? "" : "s"} this week${s.count > s.top.length ? ", including" : ""}:</p>
        <ul>${s.top.map((p) => `<li><a href="${esc(p.url)}">${esc(p.title)}</a></li>`).join("")}</ul>
        <p><a href="${SITE}/species/${slugify(name)}/research">All ${esc(name)} research</a></p>
        ${stop("species", `Stop research updates for ${esc(name)}`, s.species_id)}`);
    }
    const subject = due.length
      ? `${due.length} ${due.length === 1 ? "animal is" : "animals are"} due to eat`
      : `New research for your ${papers.length === 1 ? (papers[0].common_name || papers[0].scientific_name).toLowerCase() : "species"}`;
    const html = layout(
      `<p>${u.display_name ? `Hi ${esc(u.display_name)},` : "Hi,"} here's your week.</p>${sections.join("")}`,
      `${papers.length ? `<a href="${unsubscribe}&amp;what=research" style="color:#888">Stop all research updates</a> · ` : ""}` +
        `<a href="${unsubscribe}" style="color:#888">Unsubscribe from the weekly digest</a> · choose what you get in <a href="${SITE}/settings" style="color:#888">Settings</a>.`,
    );
    if ((await send(key, u.email, subject, html, unsubscribe)).ok) {
      await admin.rpc("fn54_mark_emailed", { p_user_id: u.user_id, p_kind: "digest" });
      sent++;
    }
  }
  return { kind: "digest", candidates: data?.length ?? 0, sent, quiet };
}

async function sendTransfers(key: string) {
  const { data, error } = await admin.rpc("fn65_pending_transfer_emails", { p_limit: BATCH });
  if (error) return { error: error.message };
  let sent = 0;
  for (const t of data ?? []) {
    const from = t.from_display_name && t.from_display_name !== t.from_username
      ? `${esc(t.from_display_name)} (@${esc(t.from_username)})`
      : `@${esc(t.from_username)}`;
    const animal = `${esc(t.animal_name)}${t.species ? `, ${esc(t.species)}` : ""}`;
    const html = layout(`
      <p>${t.to_name ? `Hi ${esc(t.to_name)},` : "Hi,"}</p>
      <p>${from} wants to transfer <strong>${animal}</strong> to you on Reptilytics.
      If you accept, the animal moves into your collection with its full history: feedings, weights, sheds, health and notes.</p>
      ${t.note ? `<p style="border-left:3px solid #ddd;padding-left:12px;color:#444">${esc(t.note).replace(/\n/g, "<br>")}</p>` : ""}
      <p><a href="${SITE}/transfers" style="display:inline-block;background:#0b5e44;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Review the transfer</a></p>
      <p style="color:#666">Not expecting this? You can decline it on the same page.</p>`);
    if ((await send(key, t.email, `${t.from_username} is transferring ${t.animal_name} to you`, html)).ok) {
      await admin.rpc("fn66_mark_transfer_notified", { p_transfer_id: t.transfer_id });
      sent++;
    }
  }
  return { kind: "transfers", candidates: data?.length ?? 0, sent };
}

async function sendShares(key: string) {
  const { data, error } = await admin.rpc("fn70_pending_share_emails", { p_limit: BATCH });
  if (error) return { error: error.message };
  let sent = 0;
  for (const s of data ?? []) {
    const from = s.from_display_name && s.from_display_name !== s.from_username
      ? `${esc(s.from_display_name)} (@${esc(s.from_username)})`
      : `@${esc(s.from_username)}`;
    const animal = `${esc(s.animal_name)}${s.species ? `, ${esc(s.species)}` : ""}`;
    const can = s.role === "caretaker"
      ? "You can see its history and log feedings, weights, sheds, health events, notes and photos."
      : "You can see its history: feedings, weights, sheds, health and notes.";
    const html = layout(`
      <p>${s.to_name ? `Hi ${esc(s.to_name)},` : "Hi,"}</p>
      <p>${from} shared <strong>${animal}</strong> with you on Reptilytics as a ${s.role}. ${can}
      It's in your collection now, and stays theirs.</p>
      <p><a href="${SITE}/animals/${s.animal_id}" style="display:inline-block;background:#0b5e44;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open ${esc(s.animal_name)}</a></p>
      <p style="color:#666">Don't want it? Choose Leave on the animal's page.</p>`);
    if ((await send(key, s.email, `${s.from_username} shared ${s.animal_name} with you`, html)).ok) {
      await admin.rpc("fn71_mark_share_notified", { p_share_id: s.share_id });
      sent++;
    }
  }
  return { candidates: data?.length ?? 0, sent };
}

// Emails written by an admin: plain text, sent as written (no branding).
async function sendOutbox(key: string) {
  const { data, error } = await admin
    .from("outbound_emails")
    .select("id, to_email, subject, body")
    .eq("status", "pending")
    .order("created_at")
    .limit(BATCH);
  if (error) return { error: error.message };
  let sent = 0;
  for (const m of data ?? []) {
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#222">${esc(m.body).replace(/\n/g, "<br>")}</div>`;
    const result = await send(key, m.to_email, m.subject, html, undefined, m.body);
    await admin
      .from("outbound_emails")
      .update(
        result.ok
          ? { status: "sent", sent_at: new Date().toISOString(), error: null, resend_id: result.id, last_event: "sent" }
          : { status: "error", error: result.error },
      )
      .eq("id", m.id);
    if (result.ok) sent++;
  }
  return { kind: "outbox", sent };
}

// Latest Resend event (delivered, opened, bounced…) for outbox emails from
// the last 30 days that haven't been opened yet.
async function refreshOpens(key: string) {
  const { data, error } = await admin
    .from("outbound_emails")
    .select("id, resend_id")
    .eq("status", "sent")
    .is("opened_at", null)
    .not("resend_id", "is", null)
    .gte("sent_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .order("sent_at", { ascending: false })
    .limit(40);
  if (error) return { error: error.message };
  let opened = 0;
  for (const m of data ?? []) {
    const res = await fetch(`https://api.resend.com/emails/${m.resend_id}`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) continue;
    const event = String((await res.json()).last_event ?? "");
    const isOpen = event === "opened" || event === "clicked";
    await admin
      .from("outbound_emails")
      .update({ last_event: event || null, ...(isOpen && { opened_at: new Date().toISOString() }) })
      .eq("id", m.id);
    if (isOpen) opened++;
    await new Promise((r) => setTimeout(r, 250)); // stay under Resend's rate limit
  }
  return { kind: "opens", checked: data?.length ?? 0, opened };
}

async function send(key: string, to: string, subject: string, html: string, unsubscribe?: string, text?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to,
      reply_to: "info@reptilytics.com",
      subject,
      html,
      ...(text && { text }),
      ...(unsubscribe && {
        headers: { "List-Unsubscribe": `<${unsubscribe.replace("/unsubscribe?", "/api/unsubscribe?")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
    }),
  });
  if (res.ok) return { ok: true as const, id: String((await res.json()).id ?? "") || null };
  const detail = `Resend ${res.status}: ${await res.text()}`;
  console.error(detail);
  return { ok: false as const, error: detail };
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
