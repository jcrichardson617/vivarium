import type { Metadata } from "next";
import Link from "next/link";
import { feedingSchedulesOn } from "@/lib/feeding";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings | Reptilytics" };

const EXPORTS = [
  ["animals", "Animals"],
  ["feedings", "Feedings"],
  ["weights", "Weights"],
  ["lengths", "Lengths"],
  ["sheds", "Sheds"],
  ["health", "Health"],
  ["notes", "Notes"],
] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: prefs }, { data: owned }, { data: mutes }, schedules] = await Promise.all([
    supabase.rpc("fn72_my_profile").single(),
    supabase.rpc("fn76_my_email_prefs").maybeSingle(),
    supabase
      .from("animal_ownership")
      .select("animals!inner(status, species(id, common_name, scientific_name))")
      .eq("user_id", user!.id)
      .eq("is_current_owner", true)
      .eq("animals.status", "active"),
    supabase.from("research_email_mutes").select("species_id"),
    feedingSchedulesOn(supabase),
  ]);
  const keptSpecies = [
    ...new Map(
      (owned ?? []).flatMap((o) => (o.animals?.species ? [[o.animals.species.id, o.animals.species] as const] : [])),
    ).values(),
  ].sort((a, b) => (a.common_name ?? a.scientific_name).localeCompare(b.common_name ?? b.scientific_name));
  const mutedIds = new Set((mutes ?? []).map((m) => m.species_id));

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Saved ✓</p>}
      <form action={saveSettings} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input name="username" required pattern="[a-zA-Z0-9_]{3,30}" maxLength={30} defaultValue={profile?.username} className="field" />
          <span className="text-xs text-muted">
            Your public profile: <Link href={`/u/${profile?.username}`} className="text-brand hover:underline">/u/{profile?.username}</Link>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input name="display_name" maxLength={60} defaultValue={profile?.display_name ?? ""} placeholder="e.g. Jon's Reptiles" className="field" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Country code
            <input name="country" maxLength={2} defaultValue={profile?.country ?? ""} placeholder="US" className="field uppercase" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Units
            <select name="unit_system" defaultValue={profile?.unit_system ?? ""} className="field">
              <option value="">Automatic</option>
              <option value="imperial">Inches / °F</option>
              <option value="metric">cm / °C</option>
            </select>
          </label>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="share_gear" defaultChecked={profile?.share_gear ?? true} className="mt-1" />
          <span>
            Count my enclosure gear in anonymous &ldquo;popular with keepers&rdquo; totals
            <span className="block text-xs text-muted">Only totals are ever shown, and only once 5+ keepers use a product.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="feeding_schedules" defaultChecked={schedules} className="mt-1" />
          <span>
            Feeding schedules
            <span className="block text-xs text-muted">
              Show when each animal is due to eat. Turn off if you don&apos;t feed on a schedule; your feeding log and
              each animal&apos;s interval are kept.
            </span>
          </span>
        </label>
        <fieldset className="flex flex-col gap-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="email_digest" defaultChecked={profile?.email_digest ?? true} className="mt-1" />
            <span>
              Weekly email digest
              <span className="block text-xs text-muted">Mondays, and skipped when there&apos;s nothing new.</span>
            </span>
          </label>
          <div className="ml-6 flex flex-col gap-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" name="email_feeding" defaultChecked={prefs?.email_feeding ?? true} className="mt-1" />
              <span>
                Feeding reminders
                <span className="block text-xs text-muted">
                  {schedules ? "Animals due or overdue to eat." : "Only sent while feeding schedules are on."}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="email_research" defaultChecked={prefs?.email_research ?? true} className="mt-1" />
              <span>New research <span className="block text-xs text-muted">Papers added that week for the species you keep.</span></span>
            </label>
            {keptSpecies.length > 0 && (
              <div className="ml-6 flex flex-col gap-1">
                <span className="text-xs text-muted">Research for:</span>
                {keptSpecies.map((sp) => (
                  <label key={sp.id} className="flex items-center gap-2">
                    <input type="hidden" name="kept_species" value={sp.id} />
                    <input type="checkbox" name="research_species" value={sp.id} defaultChecked={!mutedIds.has(sp.id)} />
                    {sp.common_name ?? <i>{sp.scientific_name}</i>}
                  </label>
                ))}
              </div>
            )}
          </div>
        </fieldset>
        <button className="btn-primary self-start">Save</button>
      </form>

      <div id="export" className="mt-12 scroll-mt-20">
        <h2 className="mb-1 text-lg font-semibold">Export your data</h2>
        <p className="mb-3 text-sm text-muted">
          CSV files for spreadsheets or other apps, covering every animal you own. Weights are in grams, lengths in cm.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {EXPORTS.map(([file, label]) => (
            <li key={file}>
              <a href={`/animals/export/${file}.csv`} download className="btn-secondary inline-block">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 rounded-lg border border-red-500/40 p-4">
        <h2 className="mb-1 text-lg font-semibold text-red-600">Delete account</h2>
        <p className="mb-3 text-sm text-muted">
          Permanently deletes your login, profile, photos, notes and purchase details. Your animals&apos; care records
          (species, dates, genetics, weights, feedings, sheds and enclosure readings) are kept anonymously for research
          and can no longer be linked to you. Animals you&apos;ve transferred to other keepers stay with them. This
          can&apos;t be undone.
        </p>
        <form action={deleteAccount} className="flex flex-wrap items-center gap-2">
          <input name="confirm" required placeholder='Type "delete my account"' autoComplete="off" className="field py-1" />
          <button className="rounded-md bg-red-600 px-4 py-1.5 font-medium text-white hover:bg-red-700">Delete account</button>
        </form>
      </div>
    </section>
  );
}
