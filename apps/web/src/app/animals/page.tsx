import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AnimalsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: pageError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Animals the user currently owns (RLS would also return other keepers' public animals).
  const { data: animals, error } = await supabase
    .from("animals")
    .select("id, name, sex, hatch_date, status, animal_code, species(common_name), animal_ownership!inner(user_id)")
    .eq("animal_ownership.user_id", user!.id)
    .eq("animal_ownership.is_current_owner", true)
    .order("name");

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My animals</h1>
        <Link href="/animals/new" className="btn-primary">
          Add animal
        </Link>
      </div>

      {pageError && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{pageError}</p>}
      {error && <p className="text-red-600">Could not load animals: {error.message}</p>}

      {animals?.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No animals yet. Add your first one to start logging.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {animals?.map((animal) => (
          <li key={animal.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold">{animal.name ?? "Unnamed"}</p>
            <p className="text-sm text-muted">
              {animal.species?.common_name ?? "Unknown species"}
              {animal.sex && animal.sex !== "unknown" ? ` · ${animal.sex}` : ""}
              {animal.animal_code ? ` · ${animal.animal_code}` : ""}
            </p>
            {animal.status !== "active" && (
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">{animal.status}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
