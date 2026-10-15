import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free Reptile Keeping Tools & Calculators | Reptilytics",
  description: "Free reptile calculators: morph genetics, snake prey size, egg hatch dates and enclosure sizes for ball pythons, leopard geckos, corn snakes and more.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold">Free tools</h1>
      <p className="mb-6 text-muted">Calculators for reptile and amphibian keepers and breeders. No account needed.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block h-full rounded-lg border border-border bg-card p-4 transition hover:border-brand">
              <p className="font-semibold">{t.title}</p>
              <p className="mt-1 text-sm text-muted">{t.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
