import Link from "next/link";

// End-of-page prompt for signed-out visitors on public pages (research, genetics).
export function SignupCta({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mb-4 max-w-md text-muted">{body}</p>
      <Link href="/signup" className="btn-primary inline-block px-6 py-3">
        Create a free account
      </Link>
      <p className="mt-2 text-xs text-muted">Free. Takes about a minute.</p>
    </section>
  );
}
