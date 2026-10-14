import type { Metadata } from "next";
import Link from "next/link";
import { resendCode, verifyCode } from "./actions";

export const metadata: Metadata = { title: "Verify your email | Reptilytics" };

// The "Confirm signup" email template shows {{ .Token }} (custom SMTP via Resend).
// Set NEXT_PUBLIC_EMAIL_CODES=false to fall back to confirmation links only.
const EMAIL_CODES_ENABLED = process.env.NEXT_PUBLIC_EMAIL_CODES !== "false";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; message?: string; next?: string }>;
}) {
  const { email = "", error, message, next = "/animals" } = await searchParams;

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
      <p className="mb-6 text-muted">
        We sent {EMAIL_CODES_ENABLED ? "a verification code" : "a confirmation link"} to{" "}
        <strong className="text-foreground">{email || "your email"}</strong>.{" "}
        {EMAIL_CODES_ENABLED
          ? "Enter it below to finish creating your account."
          : "Click the link in that email to finish creating your account."}
      </p>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{message}</p>}

      {EMAIL_CODES_ENABLED && (
      <form action={verifyCode} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1 text-sm">
          Verification code
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
        <button className="btn-primary mt-2">Verify and continue</button>
      </form>
      )}

      <form action={resendCode} className="mt-6 text-center text-sm text-muted">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        Didn&apos;t get it? Check your spam folder, or{" "}
        <button className="text-brand hover:underline">send a new {EMAIL_CODES_ENABLED ? "code" : "link"}</button>.
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
