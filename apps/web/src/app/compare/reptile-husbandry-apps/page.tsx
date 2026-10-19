import type { Metadata } from "next";
import Link from "next/link";

// Draft: noindex and left out of the sitemap until reviewed.
export const metadata: Metadata = {
  title: "Best Reptile Husbandry Apps Compared (2026) | Reptilytics",
  description:
    "Reptilytics, Husbandry.Pro, ReptiCare, Reptile Buddy, MorphMarket Husbandry and Herpville compared: platforms, price, breeding, genetics and enclosure logging.",
  alternates: { canonical: "/compare/reptile-husbandry-apps" },
  robots: { index: false, follow: true },
};

const CHECKED = "October 2026";

type Cell = "yes" | "no" | "paid" | string;

const APPS = ["Reptilytics", "Husbandry.Pro", "ReptiCare", "Reptile Buddy", "MorphMarket", "Herpville"];

const ROWS: { label: string; cells: Cell[] }[] = [
  { label: "Free to start", cells: ["yes", "Not listed", "Up to 10 animals", "Freemium", "yes", "Not listed"] },
  { label: "Works in a web browser", cells: ["yes", "yes", "Not listed", "Users say no", "yes", "Not listed"] },
  { label: "Native phone app", cells: ["Not yet (works in your phone's browser)", "yes", "iPhone", "yes", "yes", "yes"] },
  { label: "Feeding, weight and shed logs", cells: ["yes", "yes", "yes", "yes", "yes", "yes"] },
  { label: "Enclosure temperatures (basking, hot, cool) and humidity", cells: ["yes", "Not listed", "Not listed", "Not listed", "Not listed", "Not listed"] },
  { label: "Breeding: pairings, clutches, incubation", cells: ["yes", "yes", "paid", "yes", "Pairings", "yes"] },
  { label: "Lineage / family trees", cells: ["yes", "Not listed", "Not listed", "Not listed", "Offspring", "Not listed"] },
  { label: "Genetics calculator", cells: ["yes", "Not listed", "Not listed", "Reported by users", "Separate tool", "Not listed"] },
  { label: "QR / barcode labels", cells: ["no", "yes", "Not listed", "Barcode scanner", "QR scanning", "yes"] },
  { label: "Reptiles and amphibians", cells: ["yes", "Reptiles", "Reptiles", "Reptiles", "Reptiles", "Reptiles"] },
  { label: "Species care facts and published research", cells: ["yes", "no", "no", "no", "no", "no"] },
  { label: "Community growth and husbandry benchmarks", cells: ["yes", "no", "no", "no", "no", "no"] },
];

const SOURCES = [
  { name: "Husbandry.Pro", url: "https://apps.apple.com/app/id1550079634" },
  { name: "ReptiCare", url: "https://mergeek.com/latest/Xr2JYnwlMl4A1eoZ" },
  { name: "Reptile Buddy vs Husbandry.Pro (MorphMarket forum)", url: "https://community.morphmarket.com/t/reptile-buddy-or-husbandry-pro/31696" },
  { name: "MorphMarket Husbandry", url: "https://support.morphmarket.com/article/302-animal-husbandry" },
  { name: "Herpville", url: "https://apps.apple.com/app/id1499428714" },
];

function Value({ v }: { v: Cell }) {
  if (v === "yes") return <span className="text-brand" aria-label="Yes">✓</span>;
  if (v === "no") return <span className="text-muted" aria-label="No">—</span>;
  if (v === "paid") return <span>Paid plan</span>;
  return <span className="text-xs text-muted">{v}</span>;
}

export default function CompareHusbandryApps() {
  return (
    <article className="flex flex-col gap-10 py-6">
      <header>
        <p className="text-sm text-muted">Comparison · checked {CHECKED}</p>
        <h1 className="mt-1 text-4xl font-bold">Reptile husbandry apps compared</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Keepers ask this all the time: which app should I use to track feedings, weights, sheds and breeding? Here is an
          honest look at the main options, including ours. We&apos;ve marked where an app doesn&apos;t list a feature rather
          than guessing, and linked our sources. Spot something out of date?{" "}
          <Link href="/contact" className="text-brand hover:underline">Tell us</Link> and we&apos;ll fix it.
        </p>
      </header>

      <section className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 font-medium text-muted">Feature</th>
              {APPS.map((a) => (
                <th key={a} className={`p-3 font-semibold ${a === "Reptilytics" ? "text-brand" : ""}`}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((r) => (
              <tr key={r.label}>
                <td className="p-3">{r.label}</td>
                {r.cells.map((c, i) => (
                  <td key={i} className="p-3 align-top"><Value v={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Which one fits you</h2>
        <div>
          <h3 className="font-semibold">Reptilytics</h3>
          <p className="text-muted">
            Best if you want your records to tell you something. Alongside the usual logs, it tracks enclosure basking,
            hot-side and cool-side temperatures, builds family trees from your breeding records, names morphs from a curated
            gene list, and puts species care facts, published research and natural history notes next to your animals.
            It&apos;s free and covers reptiles and amphibians. There&apos;s no native app or label printing yet: it runs in any
            browser, including your phone&apos;s.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Husbandry.Pro</h3>
          <p className="text-muted">
            A long-standing choice for breeders with racks. It has phone apps plus a web version, QR-code labels, feeding
            reminders and weight charts. Forum users say it doesn&apos;t have a built-in genetics calculator.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">ReptiCare</h3>
          <p className="text-muted">
            A simple iPhone tracker for pet keepers: feeding, weight, health, shedding and brumation, plus UVB bulb
            replacement reminders and exportable records for vet visits. Free for up to 10 reptiles; breeding tools need
            the paid Pro plan.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Reptile Buddy</h3>
          <p className="text-muted">
            A phone app (iPhone and Android) for tracking growth, feeding and breeding, with a barcode scanner and quick
            rack-level entry. Users describe it as mobile-only, with no desktop version.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">MorphMarket Husbandry</h3>
          <p className="text-muted">
            Free and built into MorphMarket, so it suits breeders who already sell there. It logs feeding, sheds, weights,
            lengths and pairings, with bulk logging and QR scanning.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Herpville</h3>
          <p className="text-muted">
            Combines record keeping with a social marketplace: bulk feeding and shed logs, reminders, breeding cycles from
            pairing to hatching, and QR label printing.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Questions keepers ask</h2>
        <div>
          <h3 className="font-semibold">Can I move my records from another app?</h3>
          <p className="text-muted">
            Not automatically yet. If you have a spreadsheet export from another app,{" "}
            <Link href="/contact" className="text-brand hover:underline">send it to us</Link> and we&apos;ll help.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Is a spreadsheet enough?</h3>
          <p className="text-muted">
            For a few animals, often yes. Apps earn their place when you want reminders, growth charts, breeding records
            that link parents to offspring, or comparisons with other keepers&apos; animals.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Who can see my animals on Reptilytics?</h3>
          <p className="text-muted">Only you, unless you make an animal public or share it with another keeper.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">Try Reptilytics free</h2>
        <p className="mx-auto mb-4 max-w-md text-muted">No credit card. Add your first animal in under a minute.</p>
        <Link href="/login" className="btn-primary inline-block px-6 py-3">Create a free account</Link>
      </section>

      <footer className="text-xs text-muted">
        <p className="mb-1">
          Based on each app&apos;s store listing, help pages and public forum posts, checked {CHECKED}. Features and prices
          change; check each app before you decide.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {SOURCES.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer nofollow" className="hover:text-foreground">{s.name}</a></li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
