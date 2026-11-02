import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppPreview } from "@/components/app-preview";
import { MontyDemo } from "@/components/monty-demo";
import { ShareButton } from "@/components/share-button";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  { n: "1", title: "Add your animals", body: "A profile for each animal in under a minute, or import your spreadsheet as a CSV." },
  { n: "2", title: "Log as you go", body: "Feedings, weights and sheds in a few taps, right at the rack." },
  { n: "3", title: "Read the data", body: "Growth charts, feeding history and comparisons with other keepers' animals turn your logs into answers." },
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cta = user ? { href: "/dashboard", label: "Go to my dashboard" } : { href: "/signup", label: "Create a free account" };

  return (
    <div className="flex flex-col gap-20 py-6">
      <section className="flex flex-col items-center gap-6 text-center">
        <Image src="/logo.png" alt="Reptilytics logo" width={140} height={140} priority className="h-24 w-24 sm:h-[140px] sm:w-[140px]" />
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">Reptilytics</h1>
          <p className="mt-2 text-base tracking-[0.15em] text-muted">Intelligence for Modern Herpetoculture</p>
        </div>
        {user ? (
          <p className="max-w-2xl text-lg">Welcome back. Your collection is waiting.</p>
        ) : (
          <>
            <p className="max-w-2xl text-2xl font-semibold leading-snug">
              Turn your husbandry records into data you can use.
            </p>
            <p className="max-w-2xl text-lg text-muted">
              Log feedings, weights and sheds for every reptile and amphibian you keep. Reptilytics charts each animal&apos;s
              growth, tells you who&apos;s due to eat, and compares it with other keepers&apos; animals of the same species, sex
              and morph as the community grows.
            </p>
          </>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={cta.href} className="btn-primary px-6 py-3">
            {cta.label}
          </Link>
          <Link href={user ? "/animals" : "/features"} className="btn-secondary px-6 py-3">
            {user ? "My animals" : "See what it does"}
          </Link>
        </div>
        {!user && <p className="text-sm text-muted">Free to use. Sign up with Google or email in about a minute.</p>}
      </section>

      {!user && (
        <section className="mx-auto w-full max-w-3xl">
          <h2 className="mb-1 text-center text-2xl font-bold">Every weigh-in, in context</h2>
          <p className="mb-5 text-center text-sm text-muted">
            An example animal. Switch the comparison to see her against her species, sex or morph.
          </p>
          <AppPreview />
        </section>
      )}

      {!user && (
        <section>
          <h2 className="mb-10 text-center text-3xl font-bold">How it works</h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col items-center text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mb-1 font-semibold">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-8 text-center">
        <Image
          src="/monty/monty.png"
          alt="Monty, a black and white tegu in a polo shirt"
          width={128}
          height={128}
          className="mx-auto mb-4"
        />
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-brand">Coming soon</p>
        <h2 className="mb-3 text-2xl font-bold">Meet Monty</h2>
        <p className="mx-auto max-w-xl text-muted">
          An AI assistant that knows your collection and the research. Ask questions and get answers with sources.
        </p>
        <MontyDemo />
      </section>

      {user ? (
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold">Know another keeper?</h2>
          <p className="max-w-md text-muted">
            Reptilytics gets better with every keeper who joins. Share it with a friend, a breeder or your local herp society.
          </p>
          <ShareButton url={SITE_URL} title="Reptilytics" label="Share Reptilytics" className="btn-primary px-6 py-3" />
        </section>
      ) : (
        <section className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold">Start your collection today</h2>
          <p className="max-w-md text-muted">
            Built by a herpetoculturist and PhD herpetologist/ecologist. Your records stay private unless you choose to
            share them.
          </p>
          <Link href={cta.href} className="btn-primary px-6 py-3">
            {cta.label}
          </Link>
        </section>
      )}
    </div>
  );
}
