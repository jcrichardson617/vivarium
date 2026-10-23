import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const supabase = await createClient();
  const { data: animal } = await supabase
    .from("animals")
    .select("id, name, sex, hatch_date, visibility, sire_id, dam_id, species(common_name, scientific_name)")
    .eq("id", id)
    .eq("visibility", "public")
    .maybeSingle();
  return { supabase, animal };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { animal } = await load(id);
  if (!animal) return { title: "Animal not found | Reptilytics" };
  const title = `${animal.name ?? "Animal"} · ${animal.species?.common_name ?? "Reptile"} | Reptilytics`;
  const description = `${animal.name ?? "This animal"}, a ${animal.species?.common_name ?? "reptile"} tracked on Reptilytics.`;
  return { title, description, alternates: { canonical: `/a/${id}` }, openGraph: { title, description, siteName: "Reptilytics" } };
}

export default async function PublicAnimalPage({ params }: Props) {
  const { id } = await params;
  const { supabase, animal } = await load(id);
  if (!animal) notFound();

  const parentIds = [animal.sire_id, animal.dam_id].filter((v): v is string => !!v);
  const [{ data: keeper }, { data: morph }, { data: photos }, { data: genes }, { data: parents }] = await Promise.all([
    supabase.rpc("fn37_public_animal_keeper", { p_animal_id: id }).maybeSingle(),
    supabase.rpc("morph_name", { p_animal_id: id }),
    supabase.from("animal_photos").select("id, storage_path, is_primary").eq("animal_id", id).order("is_primary", { ascending: false }).order("created_at"),
    supabase.from("animal_genes").select("id, status, het_probability, genes(name)").eq("animal_id", id),
    // Only parents that are themselves public will come back.
    parentIds.length
      ? supabase.from("animals").select("id, name").in("id", parentIds).eq("visibility", "public")
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
  ]);

  const signed = photos?.length
    ? (await supabase.storage.from("animal-photos").createSignedUrls(photos.map((p) => p.storage_path), 3600)).data ?? []
    : [];
  const sire = parents?.find((p) => p.id === animal.sire_id);
  const dam = parents?.find((p) => p.id === animal.dam_id);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">{animal.name ?? "Unnamed"}</h1>
        <p className="text-muted">
          {animal.species?.common_name}
          {animal.species?.scientific_name && <span className="italic"> · {animal.species.scientific_name}</span>}
          {animal.sex && animal.sex !== "unknown" ? ` · ${animal.sex}` : ""}
        </p>
        {morph && morph !== "Normal" && <p className="mt-1 font-medium">{morph}</p>}
        {keeper && (
          <p className="mt-2 text-sm text-muted">
            Kept by{" "}
            <Link href={`/u/${keeper.username}`} className="text-brand hover:underline">
              {keeper.display_name && keeper.display_name !== "New User" ? keeper.display_name : keeper.username}
            </Link>
          </p>
        )}
      </header>

      {!!signed.length && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {signed.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.path} src={s.signedUrl ?? undefined} alt={animal.name ?? "Animal photo"} className={`w-full rounded-lg border border-border object-cover ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:col-span-2" : "aspect-square"}`} />
          ))}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Hatched</dt>
          <dd className="font-medium">{animal.hatch_date ? new Date(animal.hatch_date).toLocaleDateString() : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Sire</dt>
          <dd className="font-medium">{sire ? <Link href={`/a/${sire.id}`} className="text-brand hover:underline">{sire.name}</Link> : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Dam</dt>
          <dd className="font-medium">{dam ? <Link href={`/a/${dam.id}`} className="text-brand hover:underline">{dam.name}</Link> : "—"}</dd>
        </div>
      </dl>

      {!!genes?.length && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Genetics</h2>
          <ul className="flex flex-wrap gap-2">
            {genes.map((g) => (
              <li key={g.id} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                {g.status === "possible_het" ? `${g.het_probability}% het ` : g.status === "het" ? "het " : g.status === "super" ? "Super " : ""}
                {g.genes?.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-sm text-muted">
        Tracked with <Link href="/" className="text-brand hover:underline">Reptilytics</Link>
      </p>
    </article>
  );
}
