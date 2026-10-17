import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "./actions";

export const metadata: Metadata = { title: "Email | Reptilytics" };

export default async function EmailAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const { data: log } = await supabase
    .from("outbound_emails")
    .select("id, to_email, subject, body, status, error, created_at, last_event, opened_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <AdminNav current="/admin/email" />
        <h1 className="text-2xl font-bold">Email</h1>
        <p className="text-muted">
          Sends from info@reptilytics.com. Replies go to info@reptilytics.com. Plain text, sent exactly as written.
          Opens are checked every 30 minutes and are approximate: some mail apps load images automatically, others block them.
        </p>
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {sent && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Sending… refresh in a few seconds to see its status below.</p>}

      <form action={sendEmail} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <label className="flex flex-col gap-1 text-sm">
          To
          <input name="to" type="email" required placeholder="someone@example.com" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Subject
          <input name="subject" required maxLength={200} className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Message
          <textarea name="body" required rows={14} maxLength={20000} className="field font-sans" />
        </label>
        <button className="btn-primary self-start">Send</button>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Sent</h2>
        {!log?.length && <p className="text-sm text-muted">Nothing sent yet.</p>}
        <ul className="flex flex-col gap-2">
          {log?.map((m) => (
            <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
              <details>
                <summary className="cursor-pointer">
                  <EmailStatus status={m.status} event={m.last_event} opened={!!m.opened_at} />{" "}
                  · {m.to_email} · <strong>{m.subject}</strong>{" "}
                  <span className="text-muted">· {new Date(m.created_at).toLocaleString("en-US")}</span>
                </summary>
                {m.error && <p className="mt-2 text-red-600">{m.error}</p>}
                <p className="mt-2 whitespace-pre-wrap text-muted">{m.body}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const EVENT_LABEL: Record<string, [string, string]> = {
  opened: ["👁 Opened", "text-brand-dark font-semibold"],
  clicked: ["👁 Opened", "text-brand-dark font-semibold"],
  delivered: ["✓ Delivered", "text-muted"],
  sent: ["✓ Sent", "text-muted"],
  delivery_delayed: ["⏳ Delayed", "text-amber-600"],
  bounced: ["✕ Bounced", "text-red-600"],
  complained: ["⚠ Marked as spam", "text-red-600"],
};

function EmailStatus({ status, event, opened }: { status: string; event: string | null; opened: boolean }) {
  if (status === "pending") return <span className="text-muted">… Pending</span>;
  if (status === "error") return <span className="text-red-600">✕ Failed</span>;
  const [label, cls] = EVENT_LABEL[opened ? "opened" : (event ?? "sent")] ?? EVENT_LABEL.sent;
  return <span className={cls}>{label}</span>;
}
