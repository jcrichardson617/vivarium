import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings | Reptilytics" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, country, unit_system, share_gear, email_digest")
    .eq("id", user!.id)
    .single();

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
          <input type="checkbox" name="email_digest" defaultChecked={profile?.email_digest ?? true} className="mt-1" />
          <span>
            Weekly email digest
            <span className="block text-xs text-muted">Mondays: who&apos;s due to eat and new research for the species you keep. Skipped when there&apos;s nothing new.</span>
          </span>
        </label>
        <button className="btn-primary self-start">Save</button>
      </form>

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
