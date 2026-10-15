import Image from "next/image";
import Link from "next/link";
import { MontyDemo } from "@/components/monty-demo";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  { n: "1", title: "Add your animals", body: "Create a profile for each animal in under a minute." },
  { n: "2", title: "Log as you go", body: "Record feedings, weights and sheds as part of your routine." },
  { n: "3", title: "See the patterns", body: "Growth charts, reminders and community benchmarks do the rest." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cta = user ? { href: "/dashboard", label: "Go to my dashboard" } : { href: "/login", label: "Create a free account" };

  return (
    <div className="flex flex-col gap-20 py-6">
      <section className="flex flex-col items-center gap-6 text-center">
        <Image src="/logo.png" alt="Reptilytics logo" width={140} height={140} priority />
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">Reptilytics</h1>
          <p className="mt-2 text-base tracking-[0.15em] text-muted">Intelligence for Modern Herpetoculture</p>
        </div>
        <p className="max-w-2xl text-lg">
          The record-keeping hub for reptile and amphibian keepers and breeders. Track every animal, log husbandry in seconds, manage
          breeding projects and genetics, and see how your animals compare with data from keepers everywhere.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={cta.href} className="btn-primary px-6 py-3">
            {cta.label}
          </Link>
          <Link href="/features" className="btn-secondary px-6 py-3">
            See what it does
          </Link>
        </div>
        <p className="text-sm text-muted">Free to use. No credit card.</p>
      </section>

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

      <section className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold">Start your collection today</h2>
        <p className="max-w-md text-muted">Built by keepers, for keepers. Your private records stay private.</p>
        <Link href={cta.href} className="btn-primary px-6 py-3">
          {cta.label}
        </Link>
      </section>
    </div>
  );
}
