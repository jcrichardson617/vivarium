import type { Metadata } from "next";
import { HatchDateCalculator } from "@/components/tools/hatch-date";
import { ToolPage } from "@/components/tools/tool-page";
import { INCUBATION } from "@/lib/husbandry-data";

export const metadata: Metadata = {
  title: "Reptile Egg Hatch Date Calculator & Incubation Temperatures | Reptilytics",
  description: "When will your eggs hatch? Enter the lay date for ball python, leopard gecko, corn snake, crested gecko, bearded dragon and more to get the hatch window.",
  alternates: { canonical: "/tools/hatch-date" },
};

const f = (c: number) => Math.round((c * 9) / 5 + 32);

export default function Page() {
  return (
    <ToolPage
      href="/tools/hatch-date"
      title="Egg hatch date calculator"
      intro="Pick a species and the lay date to see when the clutch should start pipping."
      about={
        <>
          <h2 className="text-xl font-semibold">Incubation temperatures and times</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-border/40 text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-3 py-2">Species</th><th className="px-3 py-2">Temperature</th><th className="px-3 py-2">Days</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INCUBATION.map((s) => (
                  <tr key={s.slug}>
                    <td className="px-3 py-1.5">{s.name}</td>
                    <td className="px-3 py-1.5">{s.tempC[0]}–{s.tempC[1]} °C ({f(s.tempC[0])}–{f(s.tempC[1])} °F)</td>
                    <td className="px-3 py-1.5">{s.days[0]}–{s.days[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Incubation length depends mostly on temperature: warmer eggs hatch sooner, cooler eggs take longer. Stable temperatures
            matter more than hitting an exact number. In leopard geckos, fat-tailed geckos and many other lizards, incubation
            temperature also decides the sex of the babies.
          </p>
          <p>
            Eggs often &ldquo;sweat&rdquo; and dimple a few days before pipping. Once the first egg pips, the rest usually follow
            within a day or two; leave pipped babies in the egg until they absorb their yolk.
          </p>
        </>
      }
    >
      <HatchDateCalculator />
    </ToolPage>
  );
}
