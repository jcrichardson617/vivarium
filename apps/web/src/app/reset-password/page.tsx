import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

export const metadata: Metadata = { title: "Choose a new password | Reptilytics", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The reset link signs the user in before landing here; without a session there's nothing to reset.
  if (!user) {
    return (
      <section className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-bold">Link expired</h1>
        <p className="mb-6 text-muted">
          This password reset link is invalid or has expired. Reset links work once, in the browser you requested them from.
        </p>
        <Link href="/forgot-password" className="btn-primary block text-center">
          Send a new link
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Choose a new password</h1>
      <p className="mb-6 text-sm text-muted">
        For <strong className="text-foreground">{user.email}</strong>.
      </p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      <form action={updatePassword} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
          <span className="text-xs text-muted">At least 8 characters.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm new password
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </label>
        <button className="btn-primary mt-2">Save new password</button>
      </form>
    </section>
  );
}
