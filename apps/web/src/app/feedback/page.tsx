import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { submitFeatureRequest } from "./actions";

export const metadata: Metadata = { title: "Request a feature | Reptilytics" };

const STATUS: Record<string, string> = { new: "Received", planned: "Planned", in_progress: "In progress", done: "Done", declined: "Not planned" };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: mine } = await supabase
    .from("feature_requests")
    .select("id, title, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Request a feature</h1>
      <p className="mb-6 text-muted">What would make Reptilytics more useful for you? We read every request.</p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Thanks! Your request was sent. ✓</p>}
      <form action={submitFeatureRequest} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Idea
          <input name="title" required minLength={3} maxLength={120} placeholder="e.g. Feeding reminders" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Details (optional)
          <textarea name="details" rows={5} maxLength={4000} placeholder="How would you use it?" className="field" />
        </label>
        <button className="btn-primary self-start">Send request</button>
      </form>

      {!!mine?.length && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Your requests</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {mine.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>{r.title}</span>
                <span className="shrink-0 text-muted">{STATUS[r.status] ?? r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
