import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "./actions";
import { GoogleSignIn } from "./google-sign-in";

export const metadata: Metadata = { title: "Sign in | Reptilytics", alternates: { canonical: "/login" } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{message}</p>}
      <GoogleSignIn next={next ?? "/dashboard"} />

      <form className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input name="password" type="password" required minLength={8} autoComplete="current-password" className="field" />
        </label>
        <button formAction={signIn} className="btn-primary mt-2">
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium text-brand hover:underline">
          Create a free account
        </Link>
      </p>
    </section>
  );
}
