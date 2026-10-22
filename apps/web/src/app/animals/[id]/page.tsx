import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moveAnimal } from "@/app/enclosures/actions";
import { cancelTransfer, requestTransfer } from "@/app/transfers/actions";
import { removeShare, shareAnimal } from "./share-actions";
import { PhotoUploader } from "@/components/photo-uploader";
import { ShareButton } from "@/components/share-button";
import { DUE_TONE_CLASS, feedingDue, feedingSchedulesOn } from "@/lib/feeding";
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

type TimelineItem = { id: string; table: string; at: string; title: string; detail: string | null; by: string | null };

const ROLE_LABEL = { caretaker: "Caretaker", viewer: "Viewer" } as const;

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
    .select("id, name, sex, hatch_date, status, animal_code, visibility, feeding_interval_days, sire_id, dam_id, species(common_name, scientific_name), species_submissions!animals_pending_species_submission_id_fkey(scientific_name, status)")
    .eq("id", id)
    .maybeSingle();
  if (!animal) notFound();

  const [{ data: enclosures }, { data: housing }] = await Promise.all([
    supabase.from("enclosures").select("id, name").eq("owner_id", user!.id).order("name"),
    supabase.from("animal_enclosures").select("enclosure_id, enclosures(name)").eq("animal_id", id).is("end_date", null).maybeSingle(),
  ]);

  const [{ data: accessRows }, { data: morph }, photos, feedings, weights, lengths, sheds, health, notes, acquisition, schedules] =
    await Promise.all([
      supabase.rpc("fn69_animal_access", { p_animal_id: id }),
      supabase.rpc("morph_name", { p_animal_id: id }),
      supabase.from("animal_photos").select("id, storage_path, is_primary, caption, uploaded_by").eq("animal_id", id).order("created_at"),
      supabase.from("feedings").select("id, fed_at, feeder_type, feeder_size, quantity, accepted, notes, fed_by").eq("animal_id", id).order("fed_at", { ascending: false }).limit(50),
      supabase.from("weight_logs").select("id, recorded_at, weight_grams, notes, recorded_by").eq("animal_id", id).order("recorded_at", { ascending: false }).limit(50),
      supabase.from("length_logs").select("id, recorded_at, length_cm, notes, recorded_by").eq("animal_id", id).order("recorded_at", { ascending: false }).limit(50),
      supabase.from("sheds").select("id, shed_date, complete_shed, retained_eye_caps, retained_tail_tip, notes, recorded_by").eq("animal_id", id).order("shed_date", { ascending: false }).limit(50),
      supabase.from("health_events").select("id, event_date, event_type, severity, notes, recorded_by").eq("animal_id", id).order("event_date", { ascending: false }).limit(50),
      supabase.from("animal_notes").select("id, created_at, note_text, created_by").eq("animal_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("animal_acquisitions").select("acquired_date").eq("animal_id", id).maybeSingle(),
      feedingSchedulesOn(supabase),
    ]);
  // Owner, caretaker (can log) or viewer (read only), and whose animal it is.
  const access = accessRows?.[0];
  const isOwner = access?.access === "owner";
  const canLog = isOwner || access?.access === "caretaker";
  const role = !isOwner && (access?.access === "caretaker" || access?.access === "viewer") ? access.access : null;
  const mine = (by: string | null) => isOwner || (canLog && by === user!.id);
  const [{ data: shares }, { data: photoLimit }] = await Promise.all([
    isOwner
      ? supabase
          .from("animal_shares")
          .select("id, role, user_id, created_at, profiles!animal_shares_user_id_fkey(username, display_name)")
          .eq("animal_id", id)
          .order("created_at")
      : Promise.resolve({ data: null }),
    canLog ? supabase.rpc("fn73_animal_photo_limit", { p_animal_id: id }) : Promise.resolve({ data: null }),
  ]);
  const { data: pendingTransfer } = isOwner
    ? await supabase
        .from("ownership_transfers")
        .select("id, created_at, to:profiles!ownership_transfers_to_user_id_fkey(username)")
        .eq("animal_id", id)
        .eq("status", "pending")
        .maybeSingle()
    : { data: null };

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
  // The owner's plan sets the photo limit, whoever uploads.
  const limit = photoLimit ?? 3;

  const latestWeight = weights.data?.[0];
  const latestFeeding = feedings.data?.find((f) => f.accepted);
  const latestShed = sheds.data?.[0];
  const due = schedules && animal.status === "active" ? feedingDue(latestFeeding?.fed_at, animal.feeding_interval_days) : null;

  const timeline: TimelineItem[] = [
    ...(feedings.data ?? []).map((f) => ({
      id: f.id, table: "feedings", at: f.fed_at,
      title: `${f.accepted ? "Fed" : "Refused"} ${f.quantity && f.quantity > 1 ? `${f.quantity} × ` : ""}${[f.feeder_size, f.feeder_type].filter(Boolean).join(" ")}`,
      detail: f.notes, by: f.fed_by,
    })),
    ...(weights.data ?? []).map((w) => ({ id: w.id, table: "weight_logs", at: w.recorded_at!, title: `Weighed ${w.weight_grams} g`, detail: w.notes, by: w.recorded_by })),
    ...(lengths.data ?? []).map((l) => ({ id: l.id, table: "length_logs", at: l.recorded_at, title: `Measured ${l.length_cm} cm`, detail: l.notes, by: l.recorded_by })),
    ...(sheds.data ?? []).map((s) => ({
      id: s.id, table: "sheds", at: s.shed_date,
      title: `${s.complete_shed ? "Complete shed" : "Incomplete shed"}${s.retained_eye_caps ? " · retained eye caps" : ""}${s.retained_tail_tip ? " · retained tail tip" : ""}`,
      detail: s.notes, by: s.recorded_by,
    })),
    ...(health.data ?? []).map((h) => ({ id: h.id, table: "health_events", at: h.event_date, title: `${h.event_type}${h.severity ? ` (${h.severity})` : ""}`, detail: h.notes, by: h.recorded_by })),
    ...(notes.data ?? []).map((n) => ({ id: n.id, table: "animal_notes", at: n.created_at, title: "Note", detail: n.note_text, by: n.created_by })),
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
        {role && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <span>
              Shared with you by{" "}
              <Link href={`/u/${access?.owner_username}`} className="text-brand hover:underline">@{access?.owner_username}</Link>
              {" · "}
              <span className="font-medium">{ROLE_LABEL[role]}</span>
              <span className="text-muted">
                {role === "caretaker" ? " · you can log care and add photos" : " · read only"}
              </span>
            </span>
            <form action={removeShare} className="ml-auto">
              <input type="hidden" name="animal_id" value={id} />
              <input type="hidden" name="user_id" value={user!.id} />
              <button className="text-muted hover:text-red-600">Leave</button>
            </form>
          </div>
        )}
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
        <p className="text-sm text-muted">
          This animal has a public page ·{" "}
          <Link href={`/a/${id}`} className="text-brand hover:underline">View</Link> ·{" "}
          <ShareButton url={`${SITE_URL}/a/${id}`} title={`${animal.name ?? "My animal"} on Reptilytics`} />
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Last meal</p>
          <p className="mt-1 font-semibold">{daysAgo(latestFeeding?.fed_at)}</p>
          {due ? (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</span>
          ) : (
            isOwner && schedules && (
              <Link href={`/animals/${id}/edit`} className="mt-1 block text-xs text-muted hover:text-brand">
                Set a feeding reminder
              </Link>
            )
          )}
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
              {mine(photo.uploaded_by) && (
                <figcaption className="flex items-center justify-between gap-2 p-2 text-xs">
                  {photo.is_primary ? (
                    <span className="font-medium text-brand">Main photo</span>
                  ) : !isOwner ? (
                    <span />
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
        {canLog && (
          <PhotoUploader animalId={id} remaining={limit - photoRows.length} hasPrimary={photoRows.some((p) => p.is_primary)} />
        )}
      </section>

      {canLog && (
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

      {isOwner && (
        <section className="rounded-lg border border-border bg-card p-4 text-sm">
          <details open={!!shares?.length}>
            <summary className="cursor-pointer select-none font-medium">
              Share with other keepers{shares?.length ? ` (${shares.length})` : ""}
            </summary>
            <p className="mt-3 text-muted">
              Caretakers can log feedings, weights, sheds, health and notes and add photos, like a partner or pet-sitter.
              Viewers can see everything but change nothing. The animal stays yours.
            </p>
            {!!shares?.length && (
              <ul className="mt-3 flex flex-col divide-y divide-border rounded-md border border-border">
                {shares.map((sh) => (
                  <li key={sh.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <Link href={`/u/${sh.profiles?.username}`} className="text-brand hover:underline">
                      @{sh.profiles?.username}
                    </Link>
                    <form action={shareAnimal} className="ml-auto flex items-center gap-2">
                      <input type="hidden" name="animal_id" value={id} />
                      <input type="hidden" name="username" value={sh.profiles?.username ?? ""} />
                      <select name="role" defaultValue={sh.role} className="field py-1" aria-label="Role">
                        <option value="caretaker">Caretaker</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button className="btn-secondary py-1">Update</button>
                    </form>
                    <form action={removeShare}>
                      <input type="hidden" name="animal_id" value={id} />
                      <input type="hidden" name="user_id" value={sh.user_id} />
                      <button className="text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={shareAnimal} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="animal_id" value={id} />
              <label className="flex flex-1 flex-col gap-1">
                Their username
                <input name="username" required placeholder="e.g. jane_reptiles" autoComplete="off" className="field" />
              </label>
              <label className="flex flex-col gap-1">
                Access
                <select name="role" defaultValue="caretaker" className="field">
                  <option value="caretaker">Caretaker</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <button className="btn-primary">Share</button>
            </form>
          </details>
        </section>
      )}

      {isOwner && (
        <section className="rounded-lg border border-border bg-card p-4 text-sm">
          {pendingTransfer ? (
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Transfer to{" "}
                <Link href={`/u/${pendingTransfer.to?.username}`} className="text-brand hover:underline">
                  @{pendingTransfer.to?.username}
                </Link>{" "}
                pending since {fmt(pendingTransfer.created_at)}. It stays yours until they accept.
              </span>
              <form action={cancelTransfer} className="ml-auto">
                <input type="hidden" name="id" value={pendingTransfer.id} />
                <input type="hidden" name="back" value={`/animals/${id}`} />
                <button className="text-red-600 hover:underline">Cancel transfer</button>
              </form>
            </div>
          ) : (
            <details>
              <summary className="cursor-pointer select-none font-medium">Transfer to another keeper</summary>
              <form action={requestTransfer} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="animal_id" value={id} />
                <p className="text-muted">
                  Sold, traded or rehomed? Send it to their Reptilytics account. When they accept, it moves to their
                  collection with its full history, and leaves yours. Your tags, enclosure and purchase details stay with you.
                </p>
                <label className="flex flex-col gap-1">
                  Their username
                  <input name="username" required placeholder="e.g. jane_reptiles" autoComplete="off" className="field" />
                </label>
                <label className="flex flex-col gap-1">
                  Note (optional)
                  <textarea name="note" rows={2} maxLength={500} placeholder="Feeding schedule, last meal, anything they should know" className="field" />
                </label>
                <button className="btn-primary self-start">Send transfer</button>
              </form>
            </details>
          )}
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
                {(item.table === "animal_notes" ? item.by === user!.id : mine(item.by)) && (
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
