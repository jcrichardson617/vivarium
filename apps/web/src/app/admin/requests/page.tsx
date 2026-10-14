import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { removeRequest, updateRequest } from "./actions";

export const metadata: Metadata = { title: "Feature requests | Reptilytics" };

const STATUSES = [
  ["new", "New"],
  ["planned", "Planned"],
  ["in_progress", "In progress"],
  ["done", "Done"],
  ["declined", "Declined"],
] as const;

export default async function FeatureRequestsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const { data: requests } = await supabase.rpc("fn36_feature_requests_admin");

  return (
    <section>
      <div className="mb-2 flex items-center gap-4 text-sm">
        <Link href="/admin/species" className="text-muted hover:text-foreground">Species requests</Link>
        <span className="font-semibold">Feature requests</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold">Feature requests</h1>
      {!requests?.length && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">No requests yet.</p>
      )}
      <ul className="flex flex-col gap-3">
        {requests?.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{r.title}</p>
              <time className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</time>
            </div>
            {r.details && <p className="mt-1 whitespace-pre-line text-sm">{r.details}</p>}
            <p className="mt-2 text-xs text-muted">
              From <strong className="text-foreground">{r.username}</strong> ({r.email}) · {r.animal_count} animal
              {r.animal_count === 1 ? "" : "s"}
              {r.species_kept ? `: ${r.species_kept}` : ""}
            </p>
            <form action={updateRequest} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="field py-1 text-sm">
                {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input name="admin_notes" defaultValue={r.admin_notes ?? ""} placeholder="Private notes" className="field flex-1 py-1 text-sm" />
              <button className="btn-secondary py-1 text-sm">Save</button>
              <button formAction={removeRequest} className="py-1 text-sm text-red-600 hover:underline">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
