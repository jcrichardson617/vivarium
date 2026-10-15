import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

// Shared frame for the free tools: title, the tool, explanatory copy, links to
// the other tools and a sign-up nudge.
export function ToolPage({
  href,
  title,
  intro,
  children,
  about,
}: {
  href: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  about: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    url: `${SITE_URL}${href}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return (
    <article className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header>
        <Link href="/tools" className="text-sm text-muted hover:text-foreground">← Free tools</Link>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="text-muted">{intro}</p>
      </header>
      {children}
      <section className="prose-sm flex flex-col gap-3 text-sm leading-relaxed">{about}</section>
      <p className="text-xs text-muted">
        General guidance from common keeping practice, not veterinary advice. Individual animals vary; when in doubt, ask a reptile vet.
      </p>
      <section className="rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">Track it all in one place</h2>
        <p className="mx-auto mb-4 max-w-md text-muted">
          Log feedings, weights, sheds and clutches, get feeding reminders and see how your animals compare. Free.
        </p>
        <Link href="/login" className="btn-primary inline-block px-6 py-3">Start tracking free</Link>
      </section>
      <nav>
        <h2 className="mb-2 font-semibold">More free tools</h2>
        <ul className="flex flex-wrap gap-2">
          {TOOLS.filter((t) => t.href !== href).map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:border-brand">{t.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
