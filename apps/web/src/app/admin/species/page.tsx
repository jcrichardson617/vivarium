import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { approveSpecies, rejectSpecies } from "./actions";

export const metadata: Metadata = { title: "Species requests | Reptilytics" };

export default async function SpeciesRequestsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const { data: requests } = await supabase
    .from("species_submissions")
    .select("id, scientific_name, common_name, taxon_class, created_at, profiles!species_submissions_submitted_by_fkey(username)")
    .eq("status", "pending")
    .order("created_at");

  return (
    <section>
      <AdminNav current="/admin/species" />
      <h1 className="mb-2 text-2xl font-bold">Species requests</h1>
      <p className="mb-6 text-muted">
        Approving adds the species for everyone and links any animals waiting on it.
      </p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {!requests?.length && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">No pending requests.</p>
      )}
      <ul className="flex flex-col gap-3">
        {requests?.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-semibold italic">{r.scientific_name}</p>
              <p className="text-sm text-muted">
                {r.common_name ?? "No common name"} · {r.taxon_class === "Amphibia" ? "Amphibian" : "Reptile"} · requested
                by {r.profiles?.username ?? "unknown"} on {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={approveSpecies}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn-primary">Approve</button>
              </form>
              <form action={rejectSpecies}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn-secondary">Reject</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
