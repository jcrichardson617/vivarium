import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moveAnimal } from "@/app/enclosures/actions";
import { PhotoUploader } from "@/components/photo-uploader";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import {
  addNote,
  deleteEntry,
  deletePhoto,
  logFeeding,
  logHealth,
  logLength,
  logShed,
  logWeight,
  makePrimaryPhoto,
} from "./actions";

export const metadata: Metadata = { title: "Animal | Reptilytics" };

const FEEDERS = ["Mouse", "Rat", "Chick", "Quail", "Rabbit", "Fish", "Crickets", "Dubia roaches", "Black soldier fly larvae", "Superworms", "Hornworms", "Mealworms", "Greens / salad", "Fruit", "Gel diet", "Other"];
const SIZES = ["Pinky", "Fuzzy", "Hopper", "Weaned", "Small", "Medium", "Large", "Jumbo", "XL"];
const HEALTH_TYPES = ["Vet visit", "Medication", "Injury", "Parasites", "Mites", "Respiratory", "Regurgitation", "Prolapse", "Stuck shed", "Weight loss", "Other"];

type TimelineItem = { id: string; table: string; at: string; title: string; detail: string | null };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function DateField() {
  return (
    <label className="flex flex-col gap-1 text-sm">
      Date
      <input name="date" type="date" defaultValue={today()} className="field" />
    </label>
  );
}

function LogCard({ title, action, animalId, children }: { title: string; action: (f: FormData) => Promise<void>; animalId: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 font-medium">{title}</summary>
      <form action={action} className="flex flex-col gap-3 border-t border-border p-4">
        <input type="hidden" name="animal_id" value={animalId} />
        {children}
        <button className="btn-primary self-start">Save</button>
      </form>
    </details>
  );
}

export default async function AnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: animal } = await supabase
    .from("animals")
    .select("id, name, sex, hatch_date, status, animal_code, visibility, sire_id, dam_id, species(common_name, scientific_name), species_submissions!animals_pending_species_submission_id_fkey(scientific_name, status)")
    .eq("id", id)
    .maybeSingle();
  if (!animal) notFound();

  const [{ data: enclosures }, { data: housing }] = await Promise.all([
    supabase.from("enclosures").select("id, name").eq("owner_id", user!.id).order("name"),
    supabase.from("animal_enclosures").select("enclosure_id, enclosures(name)").eq("animal_id", id).is("end_date", null).maybeSingle(),
  ]);

  const [{ data: isOwner }, { data: morph }, photos, feedings, weights, lengths, sheds, health, notes, acquisition, profile] =
    await Promise.all([
      supabase.rpc("fn06_is_current_owner", { p_animal_id: id, p_user_id: user!.id }),
      supabase.rpc("morph_name", { p_animal_id: id }),
      supabase.from("animal_photos").select("id, storage_path, is_primary, caption").eq("animal_id", id).order("created_at"),
      supabase.from("feedings").select("id, fed_at, feeder_type, feeder_size, quantity, accepted, notes").eq("animal_id", id).order("fed_at", { ascending: false }).limit(50),
      supabase.from("weight_logs").select("id, recorded_at, weight_grams, notes").eq("animal_id", id).order("recorded_at", { ascending: false }).limit(50),
      supabase.from("length_logs").select("id, recorded_at, length_cm, notes").eq("animal_id", id).order("recorded_at", { ascending: false }).limit(50),
      supabase.from("sheds").select("id, shed_date, complete_shed, retained_eye_caps, retained_tail_tip, notes").eq("animal_id", id).order("shed_date", { ascending: false }).limit(50),
      supabase.from("health_events").select("id, event_date, event_type, severity, notes").eq("animal_id", id).order("event_date", { ascending: false }).limit(50),
      supabase.from("animal_notes").select("id, created_at, note_text").eq("animal_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("animal_acquisitions").select("acquired_date").eq("animal_id", id).maybeSingle(),
      supabase.from("profiles").select("plan").eq("id", user!.id).single(),
    ]);

  const parentIds = [animal.sire_id, animal.dam_id].filter((v): v is string => !!v);
  const { data: parentRows } = parentIds.length
    ? await supabase.from("animals").select("id, name").in("id", parentIds)
    : { data: [] as { id: string; name: string | null }[] };
  const parents = {
    sire: parentRows?.find((p) => p.id === animal.sire_id),
    dam: parentRows?.find((p) => p.id === animal.dam_id),
  };

  const photoRows = photos.data ?? [];
  const signed = photoRows.length
    ? (await supabase.storage.from("animal-photos").createSignedUrls(photoRows.map((p) => p.storage_path), 3600)).data ?? []
    : [];
  const photoUrls = new Map(signed.map((s) => [s.path, s.signedUrl]));
  const limit = profile.data?.plan === "premium" ? 10 : 3;

  const latestWeight = weights.data?.[0];
  const latestFeeding = feedings.data?.find((f) => f.accepted);
  const latestShed = sheds.data?.[0];

  const timeline: TimelineItem[] = [
    ...(feedings.data ?? []).map((f) => ({
      id: f.id, table: "feedings", at: f.fed_at,
      title: `${f.accepted ? "Fed" : "Refused"} ${f.quantity && f.quantity > 1 ? `${f.quantity} × ` : ""}${[f.feeder_size, f.feeder_type].filter(Boolean).join(" ")}`,
      detail: f.notes,
    })),
    ...(weights.data ?? []).map((w) => ({ id: w.id, table: "weight_logs", at: w.recorded_at!, title: `Weighed ${w.weight_grams} g`, detail: w.notes })),
    ...(lengths.data ?? []).map((l) => ({ id: l.id, table: "length_logs", at: l.recorded_at, title: `Measured ${l.length_cm} cm`, detail: l.notes })),
    ...(sheds.data ?? []).map((s) => ({
      id: s.id, table: "sheds", at: s.shed_date,
      title: `${s.complete_shed ? "Complete shed" : "Incomplete shed"}${s.retained_eye_caps ? " · retained eye caps" : ""}${s.retained_tail_tip ? " · retained tail tip" : ""}`,
      detail: s.notes,
    })),
    ...(health.data ?? []).map((h) => ({ id: h.id, table: "health_events", at: h.event_date, title: `${h.event_type}${h.severity ? ` (${h.severity})` : ""}`, detail: h.notes })),
    ...(notes.data ?? []).map((n) => ({ id: n.id, table: "animal_notes", at: n.created_at, title: "Note", detail: n.note_text })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const speciesLabel =
    animal.species?.common_name ??
    (animal.species_submissions ? `${animal.species_submissions.scientific_name} (species pending review)` : "Unknown species");
  const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—");
  const daysAgo = (d: string | null | undefined) =>
    d ? `${Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 86400000))} days ago` : "never";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/animals" className="text-sm text-muted hover:text-foreground">
          ← My animals
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{animal.name ?? "Unnamed"}</h1>
          {isOwner && (
            <Link href={`/animals/${id}/edit`} className="btn-secondary text-sm">
              Edit
            </Link>
          )}
        </div>
        <p className="text-muted">
          {speciesLabel}
          {animal.species?.scientific_name && <span className="italic"> · {animal.species.scientific_name}</span>}
          {animal.sex && animal.sex !== "unknown" ? ` · ${animal.sex}` : ""}
          {morph && morph !== "Normal" ? ` · ${morph}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          Hatched {fmt(animal.hatch_date)} · Acquired {fmt(acquisition.data?.acquired_date)}
          {animal.status !== "active" ? ` · ${animal.status.replace("_", " ")}` : ""}
          {animal.visibility === "public" ? " · Public" : ""}
        </p>
        {(parents.sire || parents.dam) && (
          <p className="mt-1 text-sm text-muted">
            {parents.sire && (
              <>Sire: <Link href={`/animals/${parents.sire.id}`} className="text-brand hover:underline">{parents.sire.name}</Link></>
            )}
            {parents.sire && parents.dam && " · "}
            {parents.dam && (
              <>Dam: <Link href={`/animals/${parents.dam.id}`} className="text-brand hover:underline">{parents.dam.name}</Link></>
            )}
          </p>
        )}
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      {isOwner && animal.visibility === "public" && (
        <p className="rounded-md border border-border bg-card p-3 text-sm">
          Public link:{" "}
          <Link href={`/a/${id}`} className="break-all text-brand hover:underline">
            {`${SITE_URL}/a/${id}`}
          </Link>
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Last meal</p>
          <p className="mt-1 font-semibold">{daysAgo(latestFeeding?.fed_at)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Weight</p>
          <p className="mt-1 font-semibold">{latestWeight ? `${latestWeight.weight_grams} g` : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Last shed</p>
          <p className="mt-1 font-semibold">{daysAgo(latestShed?.shed_date)}</p>
        </div>
      </section>

      {isOwner && (
        <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <span className="font-medium">Housed in:</span>
          {housing?.enclosure_id ? (
            <Link href={`/enclosures/${housing.enclosure_id}`} className="text-brand hover:underline">
              {housing.enclosures?.name}
            </Link>
          ) : (
            <span className="text-muted">No enclosure</span>
          )}
          {enclosures?.length ? (
            <form action={moveAnimal} className="ml-auto flex items-center gap-2">
              <input type="hidden" name="animal_id" value={id} />
              <input type="hidden" name="back" value={`/animals/${id}`} />
              <select name="enclosure_id" defaultValue={housing?.enclosure_id ?? ""} className="field py-1">
                <option value="">— none —</option>
                {enclosures.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button className="btn-secondary py-1">Move</button>
            </form>
          ) : (
            <Link href="/enclosures/new" className="ml-auto text-brand hover:underline">Add an enclosure</Link>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Photos</h2>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photoRows.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-card">
              {/* Signed URLs from private storage; plain img avoids configuring remote image domains. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrls.get(photo.storage_path) ?? ""} alt={animal.name ?? "Animal photo"} className="aspect-square w-full object-cover" />
              {isOwner && (
                <figcaption className="flex items-center justify-between gap-2 p-2 text-xs">
                  {photo.is_primary ? (
                    <span className="font-medium text-brand">Main photo</span>
                  ) : (
                    <form action={makePrimaryPhoto}>
                      <input type="hidden" name="animal_id" value={id} />
                      <input type="hidden" name="photo_id" value={photo.id} />
                      <button className="text-muted hover:text-foreground">Make main</button>
                    </form>
                  )}
                  <form action={deletePhoto}>
                    <input type="hidden" name="animal_id" value={id} />
                    <input type="hidden" name="photo_id" value={photo.id} />
                    <input type="hidden" name="storage_path" value={photo.storage_path} />
                    <button className="text-red-600 hover:underline">Delete</button>
                  </form>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {isOwner && (
          <PhotoUploader animalId={id} remaining={limit - photoRows.length} hasPrimary={photoRows.some((p) => p.is_primary)} />
        )}
      </section>

      {isOwner && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Log</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <LogCard title="🍽️ Feeding" action={logFeeding} animalId={id}>
              <DateField />
              <label className="flex flex-col gap-1 text-sm">
                Food
                <select name="feeder_type" className="field">
                  {FEEDERS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Size
                  <select name="feeder_size" defaultValue="" className="field">
                    <option value="">—</option>
                    {SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Quantity
                  <input name="quantity" type="number" min={1} defaultValue={1} className="field" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="refused" /> Refused
              </label>
              <input name="notes" placeholder="Notes (optional)" className="field" />
            </LogCard>

            <LogCard title="⚖️ Weight" action={logWeight} animalId={id}>
              <DateField />
              <label className="flex flex-col gap-1 text-sm">
                Weight (grams)
                <input name="weight_grams" type="number" step="0.1" min={0.1} required className="field" />
              </label>
              <input name="notes" placeholder="Notes (optional)" className="field" />
            </LogCard>

            <LogCard title="📏 Length" action={logLength} animalId={id}>
              <DateField />
              <label className="flex flex-col gap-1 text-sm">
                Length (cm)
                <input name="length_cm" type="number" step="0.1" min={0.1} required className="field" />
              </label>
              <input name="notes" placeholder="Notes (optional)" className="field" />
            </LogCard>

            <LogCard title="🐍 Shed" action={logShed} animalId={id}>
              <DateField />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="incomplete" /> Incomplete shed</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="retained_eye_caps" /> Retained eye caps</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="retained_tail_tip" /> Retained tail tip</label>
              <input name="notes" placeholder="Notes (optional)" className="field" />
            </LogCard>

            <LogCard title="🩺 Health event" action={logHealth} animalId={id}>
              <DateField />
              <label className="flex flex-col gap-1 text-sm">
                Type
                <select name="event_type" className="field">
                  {HEALTH_TYPES.map((h) => <option key={h}>{h}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Severity
                <select name="severity" defaultValue="" className="field">
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <input name="notes" placeholder="What happened?" className="field" />
            </LogCard>

            <LogCard title="📝 Note" action={addNote} animalId={id}>
              <textarea name="note_text" required rows={3} placeholder="Anything worth remembering" className="field" />
            </LogCard>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">History</h2>
        {!timeline.length && <p className="text-muted">Nothing logged yet.</p>}
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {timeline.map((item) => (
            <li key={`${item.table}-${item.id}`} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                {item.detail && <p className="text-muted">{item.detail}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-muted">
                <time dateTime={item.at}>{fmt(item.at)}</time>
                {isOwner && (
                  <form action={deleteEntry}>
                    <input type="hidden" name="animal_id" value={id} />
                    <input type="hidden" name="table" value={item.table} />
                    <input type="hidden" name="id" value={item.id} />
                    <button aria-label="Delete entry" className="hover:text-red-600">✕</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
