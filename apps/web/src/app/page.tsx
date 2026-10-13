import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-6 py-12 text-center">
      <Image src="/logo.webp" alt="Reptilytics logo" width={140} height={140} priority />
      <h1 className="text-4xl font-bold tracking-tight">Reptilytics</h1>
      <p className="max-w-md text-lg text-muted">
        Track your collection, log husbandry in seconds, and learn from what the whole community records.
      </p>
      <Link
        href="/animals"
        className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
      >
        Get started
      </Link>
    </section>
  );
}
