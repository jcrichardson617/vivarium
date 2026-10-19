import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { MontyDemo } from "@/components/monty-demo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reptile Husbandry Software Features | Reptilytics",
  description:
    "Husbandry software for reptile and amphibian keepers: feeding, weight and shed logs, enclosure basking, hot and cool side temperatures, breeding projects, genetics and research.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  {
    title: "Your whole collection in one place",
    body: "Profiles for every animal: species, sex, morph genetics, locality, lineage, photos and ownership history that follows the animal when it changes hands.",
    points: ["Private by default, public when you choose", "Your own tag or tub codes", "Status for sold, on loan or deceased animals"],
  },
  {
    title: "Log husbandry in seconds",
    body: "Feedings, weights, lengths, sheds and health notes, built to be quick enough to use at the rack.",
    points: ["Spot a missed meal or a stalled weight early", "Retained eye caps and incomplete sheds", "Enclosure temperatures and humidity"],
  },
  {
    title: "Breeding, start to finish",
    body: "Pairings, clutches, individual eggs, incubation conditions and hatch results in one connected record.",
    points: ["Hatchlings inherit their parents automatically", "Family trees going back generations", "Hatch rates per clutch"],
  },
  {
    title: "Structured genetics",
    body: "Pick genes from a curated, species-specific list instead of typing morph names.",
    points: ["Visual, super, het and possible-het tracking", "Morph names built for you, consistently", "New genes reviewed before they are added"],
  },
  {
    title: "Learn from the community",
    body: "HerpAtlas, our data layer, compares your animals against anonymized community records.",
    points: ["See what normal growth looks like for a species", "Compare feeding and enclosure practices", "Only shown when enough keepers contribute to stay anonymous"],
  },
  {
    title: "Research, with sources",
    body: "Search care information and published research by species.",
    points: ["Open-access papers and published abstracts", "Community observations kept separate from science", "Every claim linked back to its source"],
  },
];

export default async function FeaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cta = user ? { href: "/animals", label: "Go to my animals" } : { href: "/login", label: "Create a free account" };

  return (
    <div className="flex flex-col gap-12 py-6">
      <header className="text-center">
        <h1 className="mb-3 text-4xl font-bold">Everything your notebook can&apos;t do</h1>
        <p className="mx-auto max-w-xl text-muted">
          Spreadsheets and notebooks hold your records. Reptilytics turns them into answers.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <section key={f.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">{f.title}</h2>
            <p className="mb-3 text-sm text-muted">{f.body}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {f.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-brand" aria-hidden="true">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-8 text-center">
        <Image
          src="/monty/monty.png"
          alt="Monty, a black and white tegu in a polo shirt"
          width={128}
          height={128}
          className="mx-auto mb-4"
        />
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-brand">Coming soon</p>
        <h2 className="mb-3 text-2xl font-bold">Monty, your AI assistant</h2>
        <p className="mx-auto max-w-xl text-muted">
          Ask questions in plain language and get answers drawn from your own records and the research, always with
          sources.
        </p>
        <MontyDemo />
      </section>

      <div className="text-center">
        <Link href={cta.href} className="btn-primary px-6 py-3">
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
