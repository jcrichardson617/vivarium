import type { Metadata } from "next";
import { PreySizeCalculator } from "@/components/tools/prey-size";
import { ToolPage } from "@/components/tools/tool-page";
import { PREY } from "@/lib/husbandry-data";

export const metadata: Metadata = {
  title: "Snake Prey Size Calculator: What Size Mouse or Rat? | Reptilytics",
  description: "Enter your snake's weight to find the right feeder size (pinky to jumbo rat) and a typical feeding interval for ball pythons, corn snakes, boas and more.",
  alternates: { canonical: "/tools/prey-size" },
};

export default function Page() {
  return (
    <ToolPage
      href="/tools/prey-size"
      title="Snake prey size calculator"
      intro="What size mouse or rat should your snake eat? Enter its weight in grams."
      about={
        <>
          <h2 className="text-xl font-semibold">How prey size is worked out</h2>
          <p>
            A common rule for pythons, boas and colubrids is a single prey item weighing about 10–15% of the snake&apos;s body weight,
            and no wider than the widest part of its body. Growing juveniles sit toward the upper end; adults, especially species that
            gain weight easily like ball pythons, do better toward the lower end with longer gaps between meals.
          </p>
          <p>
            Weigh your snake every few weeks on a gram scale and re-check: as it grows, the right feeder size changes. A visible lump
            after eating is normal; regurgitation or prey that is clearly wider than the snake means the item was too big.
          </p>
          <h2 className="text-xl font-semibold">Feeder size chart</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-border/40 text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-3 py-2">Feeder</th><th className="px-3 py-2">Typical weight</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PREY.map((p) => (
                  <tr key={`${p.kind}-${p.size}`}>
                    <td className="px-3 py-1.5">{p.size} {p.kind.toLowerCase()}</td>
                    <td className="px-3 py-1.5">{p.grams[0]}–{p.grams[1]} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted">Feeder weights vary by supplier; weigh a few if you can.</p>
        </>
      }
    >
      <PreySizeCalculator />
    </ToolPage>
  );
}
