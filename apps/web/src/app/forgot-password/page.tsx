import type { Metadata } from "next";
import Link from "next/link";
import { requestReset, verifyResetCode } from "./actions";

export const metadata: Metadata = { title: "Reset your password | Reptilytics", robots: { index: false } };

// The "Reset Password" email template can show {{ .Token }} alongside the link, so
// a reset requested on one device can be finished on another. Same flag as /verify.
const EMAIL_CODES_ENABLED = process.env.NEXT_PUBLIC_EMAIL_CODES !== "false";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email = "", error, sent } = await searchParams;

  if (sent) {
    return (
      <section className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="mb-6 text-muted">
          If <strong className="text-foreground">{email || "that address"}</strong> has a Reptilytics account, we sent it a
          link to reset your password. Open the link to choose a new one.
        </p>
        {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

        {EMAIL_CODES_ENABLED && (
          <form action={verifyResetCode} className="flex flex-col gap-3">
            <input type="hidden" name="email" value={email} />
            <label className="flex flex-col gap-1 text-sm">
              Or enter the code from the email
              <input
                name="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,12}"
                maxLength={12}
                placeholder="123456"
                className="field text-center text-2xl tracking-[0.4em]"
              />
            </label>
            <button className="btn-primary mt-2">Continue</button>
          </form>
        )}

        <form action={requestReset} className="mt-6 text-center text-sm text-muted">
          <input type="hidden" name="email" value={email} />
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button className="text-brand hover:underline">send another email</button>.
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-muted hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Forgot your password?</h1>
      <p className="mb-6 text-sm text-muted">Enter the email you signed up with and we&apos;ll send you a link to reset it.</p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      <form action={requestReset} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" defaultValue={email} className="field" />
        </label>
        <button className="btn-primary mt-2">Send reset link</button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
