import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../login/actions";
import { GoogleSignIn } from "../login/google-sign-in";

export const metadata: Metadata = { title: "Create an account | Reptilytics", alternates: { canonical: "/signup" } };

function Required() {
  return <span className="text-xs font-normal text-muted">(required)</span>;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Create your free account</h1>
      <p className="mb-6 text-sm text-muted">Fill in all three fields below. We&apos;ll email you a code to confirm your address.</p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      <GoogleSignIn next={next ?? "/dashboard"} />

      <form action={signUp} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>
            Email <Required />
          </span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>
            Username <Required />
          </span>
          <input
            name="username"
            required
            maxLength={30}
            pattern="[a-zA-Z0-9_]{3,30}"
            title="3-30 letters, numbers or underscores"
            autoComplete="username"
            placeholder="e.g. tegu_keeper"
            className="field"
          />
          <span className="text-xs text-muted">Shown on your public profile. 3-30 letters, numbers and underscores.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>
            Password <Required />
          </span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
          <span className="text-xs text-muted">At least 8 characters.</span>
        </label>
        <button className="btn-primary mt-2">Create account</button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
