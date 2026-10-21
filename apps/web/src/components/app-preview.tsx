"use client";

import Image from "next/image";
import { useState } from "react";

// A static preview of the app for the Features page. Nothing here reads the
// database; dates are written relatively so the server and browser render the same.
// Photos in /public/demo are CC0 / public domain, from Wikimedia Commons:
// Queen Alphabet the ball python (Capen Hill Nature Sanctuary), Ball python and rock,
// Killer bee ball python snake, Leopard gecko wink,
// Super Empty Back Crested Gecko, Western hognose at a pet store.

const TABS = ["Animal", "Collection", "Enclosure"] as const;
type Tab = (typeof TABS)[number];

// Monthly weights (g) for a female ball python, hatched April 2024, with the
// community 25th–75th percentile band for the same age.
const WEIGHTS = [
  { m: "Jun", g: 78, lo: 70, hi: 95 },
  { m: "Aug", g: 140, lo: 110, hi: 160 },
  { m: "Oct", g: 215, lo: 160, hi: 240 },
  { m: "Dec", g: 290, lo: 210, hi: 320 },
  { m: "Feb", g: 360, lo: 260, hi: 400 },
  { m: "Apr", g: 455, lo: 320, hi: 490 },
  { m: "Jun", g: 540, lo: 380, hi: 580 },
  { m: "Aug", g: 610, lo: 440, hi: 660 },
  { m: "Oct", g: 702, lo: 500, hi: 740 },
];

const HISTORY = [
  { title: "Fed: small rat (frozen-thawed)", detail: "Took it right away", when: "3 days ago" },
  { title: "Weight: 702 g", detail: "+31 g in 4 weeks", when: "3 days ago" },
  { title: "Shed: complete", detail: "Eye caps off · humid hide in use", when: "12 days ago" },
  { title: "Fed: small rat (frozen-thawed)", detail: null, when: "10 days ago" },
  { title: "Refused: small rat", detail: "In blue, expected", when: "17 days ago" },
  { title: "Note", detail: "Moved to Rack A, tub 3 · temps checked", when: "1 month ago" },
];

const COLLECTION = [
  { name: "Mango", photo: "/demo/mango.jpg", species: "Ball Python", morph: "Normal, het Clown", sex: "F", weight: "702 g", due: "Due in 4 days", tone: "ok" },
  { name: "Biscuit", photo: "/demo/biscuit.jpg", species: "Leopard Gecko", morph: "Normal", sex: "M", weight: "68 g", due: "Due today", tone: "due" },
  { name: "Juno", photo: "/demo/juno.jpg", species: "Crested Gecko", morph: "Super Empty Back", sex: "F", weight: "41 g", due: "Due in 2 days", tone: "ok" },
  { name: "Atlas", photo: "/demo/atlas.jpg", species: "Ball Python", morph: "Killer Bee", sex: "M", weight: "1,140 g", due: "Overdue 3 days", tone: "late" },
  { name: "Pepper", photo: "/demo/pepper.jpg", species: "Western Hognose", morph: "Normal", sex: "F", weight: "212 g", due: "Due in 5 days", tone: "ok" },
] as const;

const MANGO_PHOTOS = ["/demo/mango-1.jpg", "/demo/mango-2.jpg"];

const READINGS = [
  { when: "Today, 8:10 am", basking: 34.1, hot: 32.0, cool: 26.5, rh: 62 },
  { when: "Yesterday, 7:55 pm", basking: 33.6, hot: 31.8, cool: 26.1, rh: 58 },
  { when: "Yesterday, 8:05 am", basking: 34.4, hot: 32.2, cool: 26.8, rh: 65 },
];

const TONE: Record<string, string> = {
  ok: "bg-brand/10 text-brand-dark",
  due: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  late: "bg-red-500/10 text-red-600",
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

function GrowthChart() {
  const W = 560;
  const H = 150;
  const max = 800;
  const x = (i: number) => 12 + (i / (WEIGHTS.length - 1)) * (W - 24);
  const y = (g: number) => H - 6 - (g / max) * (H - 16);
  const band =
    WEIGHTS.map((w, i) => `${i ? "L" : "M"}${x(i)},${y(w.hi)}`).join(" ") +
    " " +
    [...WEIGHTS].reverse().map((w, i) => `L${x(WEIGHTS.length - 1 - i)},${y(w.lo)}`).join(" ") +
    " Z";
  const line = WEIGHTS.map((w, i) => `${i ? "L" : "M"}${x(i)},${y(w.g)}`).join(" ");
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand" aria-hidden /> Mango</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-brand/15" aria-hidden /> Typical for her age</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" role="img" aria-label="Mango's weight, 78 g to 702 g over 16 months, at the upper end of the typical range">
        <path d={band} className="fill-brand/15" />
        <path d={line} fill="none" strokeWidth={2.5} strokeLinejoin="round" className="stroke-brand" />
        {WEIGHTS.map((w, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(w.g)} r={3} className="fill-brand" />
            <text x={x(i)} y={H + 13} textAnchor="middle" className="fill-muted text-[10px]">{w.m}</text>
          </g>
        ))}
        <text x={x(WEIGHTS.length - 1) - 6} y={y(702) - 8} textAnchor="end" className="fill-foreground text-[11px] font-semibold">702 g</text>
      </svg>
    </div>
  );
}

function FeedingStrip() {
  // 30 days: fed every ~7 days, one refusal.
  const days = Array.from({ length: 30 }, (_, i) => (i === 12 ? "refused" : [5, 19, 26].includes(i) ? "fed" : null));
  return (
    <div>
      <div className="mb-1 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-fed" aria-hidden /> Fed 3</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-refused" aria-hidden /> Refused 1</span>
        <span className="ml-auto">Last 30 days</span>
      </div>
      <div className="flex h-10 items-end gap-[3px]" aria-label="3 meals and 1 refusal in the last 30 days" role="img">
        {days.map((d, i) => (
          <span
            key={i}
            className={`flex-1 rounded-sm ${d === "fed" ? "h-full bg-chart-fed" : d === "refused" ? "h-full bg-chart-refused" : "h-1 bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}

function AnimalView() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-2xl font-bold">Mango</h3>
        <p className="text-sm text-muted">Ball Python <span className="italic">· Python regius</span> · female · Normal, het Clown</p>
        <p className="text-xs text-muted">Hatched Apr 2024 · Sire: Atlas · Dam: Saffron · Rack A, tub 3</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MANGO_PHOTOS.map((src, i) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
            <Image src={src} alt={i === 0 ? "Mango, a ball python, on aspen bedding" : "Mango"} fill sizes="(min-width: 768px) 360px, 50vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Tile label="Last meal" value="3 days ago" note="Next due in 4 days" />
        <Tile label="Weight" value="702 g" note="+31 g this month" />
        <Tile label="Last shed" value="12 days ago" note="Complete" />
      </div>
      <section className="rounded-lg border border-border bg-background p-3">
        <p className="mb-2 text-sm font-semibold">Growth vs. other ball pythons her age</p>
        <GrowthChart />
      </section>
      <section className="rounded-lg border border-border bg-background p-3">
        <FeedingStrip />
      </section>
      <section>
        <p className="mb-2 text-sm font-semibold">History</p>
        <ol className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
          {HISTORY.map((h, i) => (
            <li key={i} className="flex items-start justify-between gap-3 px-3 py-2">
              <div>
                <p className="font-medium">{h.title}</p>
                {h.detail && <p className="text-xs text-muted">{h.detail}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted">{h.when}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CollectionView() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold">My animals</h3>
        <span className="text-sm text-muted">5 animals · 2 need attention</span>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
        {COLLECTION.map((a) => (
          <li key={a.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
            <Image src={a.photo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <span className="min-w-0 flex-1">
              <span className="font-medium">{a.name}</span>{" "}
              <span className="text-muted">{a.sex}</span>
              <span className="block truncate text-xs text-muted">{a.species} · {a.morph}</span>
            </span>
            <span className="text-xs text-muted">{a.weight}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[a.tone]}`}>{a.due}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Filter by species, tag or rack, and log a feeding for a whole rack at once.</p>
    </div>
  );
}

function EnclosureView() {
  const within = (v: number, lo: number, hi: number) => (v >= lo && v <= hi ? "" : "text-amber-700 dark:text-amber-400");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-2xl font-bold">Rack A, tub 3</h3>
        <p className="text-sm text-muted">PVC enclosure · 120 × 60 × 60 cm · cypress mulch · heat panel on thermostat</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Tile label="Basking" value="34 °C" note="Target 33–35" />
        <Tile label="Hot side" value="32 °C" note="Target 31–33" />
        <Tile label="Cool side" value="26.5 °C" note="Target 25–27" />
        <Tile label="Humidity" value="62%" note="Target 55–70" />
      </div>
      <section>
        <p className="mb-2 text-sm font-semibold">Readings</p>
        <ol className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
          {READINGS.map((r) => (
            <li key={r.when} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                Basking <span className={within(r.basking, 33, 35)}>{r.basking}°</span> · Hot {r.hot}° · Cool {r.cool}° ·{" "}
                <span className={within(r.rh, 55, 70)}>{r.rh}% RH</span>
              </span>
              <span className="text-xs text-muted">{r.when}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-lg border border-border bg-background p-3 text-sm">
        <p className="mb-1 font-semibold">Gear</p>
        <p className="text-muted">Heat panel 80 W · Digital thermostat · Hygrometer · Humid hide</p>
      </section>
    </div>
  );
}

export function AppPreview() {
  const [tab, setTab] = useState<Tab>("Animal");
  // The other tabs glow until the visitor clicks one, so it's clear they're clickable.
  const [explored, setExplored] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto truncate rounded-md bg-background px-3 py-0.5 text-xs text-muted">reptilytics.com</span>
        <span className="w-12" aria-hidden />
      </div>
      <div role="tablist" aria-label="App screens" className="flex gap-1 border-b border-border px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setExplored(true);
            }}
            className={`rounded-t-md px-3 py-1.5 text-sm ${tab === t ? "border border-b-0 border-border bg-background font-semibold" : `text-muted hover:text-foreground ${explored ? "" : "tab-glow"}`}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="bg-background/40 p-4 sm:p-5">
        {tab === "Animal" && <AnimalView />}
        {tab === "Collection" && <CollectionView />}
        {tab === "Enclosure" && <EnclosureView />}
      </div>
    </div>
  );
}
