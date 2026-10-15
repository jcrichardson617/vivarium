import Link from "next/link";
import { DUE_TONE_CLASS, feedingDue } from "@/lib/feeding";
import { createClient } from "@/lib/supabase/server";

export default async function AnimalsPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error: pageError, deleted } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Animals the user currently owns (RLS would also return other keepers' public animals).
  const { data: animals, error } = await supabase
    .from("animals")
    .select("id, name, sex, hatch_date, status, animal_code, feeding_interval_days, species(common_name), species_submissions!animals_pending_species_submission_id_fkey(scientific_name, status), animal_ownership!inner(user_id)")
    .eq("animal_ownership.user_id", user!.id)
    .eq("animal_ownership.is_current_owner", true)
    .order("name");

  // Last accepted meal per animal, for feeding reminders.
  const remindable = (animals ?? []).filter((a) => a.feeding_interval_days && a.status === "active").map((a) => a.id);
  const { data: meals } = remindable.length
    ? await supabase.from("feedings").select("animal_id, fed_at").in("animal_id", remindable).eq("accepted", true).order("fed_at", { ascending: false })
    : { data: [] };
  const lastMeal = new Map<string, string>();
  for (const m of meals ?? []) if (!lastMeal.has(m.animal_id)) lastMeal.set(m.animal_id, m.fed_at);
  const dueById = new Map(
    (animals ?? []).map((a) => [a.id, a.status === "active" ? feedingDue(lastMeal.get(a.id), a.feeding_interval_days) : null]),
  );
  const dueCount = [...dueById.values()].filter((d) => d && d.days <= 0).length;

  // Main photo per animal (or its first photo if none is marked), via signed URLs.
  const { data: photos } = animals?.length
    ? await supabase
        .from("animal_photos")
        .select("animal_id, storage_path, is_primary, created_at")
        .in("animal_id", animals.map((a) => a.id))
        .order("is_primary", { ascending: false })
        .order("created_at")
    : { data: [] };
  const coverPath = new Map<string, string>();
  for (const p of photos ?? []) if (!coverPath.has(p.animal_id)) coverPath.set(p.animal_id, p.storage_path);
  const { data: signed } = coverPath.size
    ? await supabase.storage.from("animal-photos").createSignedUrls([...coverPath.values()], 3600)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My animals</h1>
        <Link href="/animals/new" className="btn-primary">
          Add animal
        </Link>
      </div>

      {deleted && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Animal deleted.</p>}
      {pageError && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{pageError}</p>}
      {dueCount > 0 && (
        <p className="mb-4 rounded-md bg-amber-500/15 p-3 text-sm text-amber-800 dark:text-amber-300">
          🍽️ {dueCount} {dueCount === 1 ? "animal is" : "animals are"} due to eat.
        </p>
      )}
      {error && <p className="text-red-600">Could not load animals: {error.message}</p>}

      {animals?.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No animals yet. Add your first one to start logging.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {animals?.map((animal) => (
          <li key={animal.id}>
            <Link
              href={`/animals/${animal.id}`}
              className="flex gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-brand"
            >
            {coverPath.has(animal.id) && urlByPath.get(coverPath.get(animal.id)!) ? (
              // Signed URL from private storage; plain img avoids configuring remote image domains.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlByPath.get(coverPath.get(animal.id)!)!}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-border/50 text-2xl text-muted">
                🦎
              </div>
            )}
            <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{animal.name ?? "Unnamed"}</p>
              {dueById.get(animal.id) && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONE_CLASS[dueById.get(animal.id)!.tone]}`}>
                  {dueById.get(animal.id)!.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted">
              {animal.species?.common_name ??
                (animal.species_submissions
                  ? `${animal.species_submissions.scientific_name} (${animal.species_submissions.status === "rejected" ? "species request rejected" : "species pending review"})`
                  : "Unknown species")}
              {animal.sex && animal.sex !== "unknown" ? ` · ${animal.sex}` : ""}
              {animal.animal_code ? ` · ${animal.animal_code}` : ""}
            </p>
            {animal.status !== "active" && (
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">{animal.status}</p>
            )}
            </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
