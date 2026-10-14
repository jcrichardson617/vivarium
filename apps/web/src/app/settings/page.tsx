import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Settings | Reptilytics" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, country, unit_system")
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
        <button className="btn-primary self-start">Save</button>
      </form>
    </section>
  );
}
