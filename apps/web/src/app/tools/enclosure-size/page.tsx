import type { Metadata } from "next";
import { EnclosureSizeGuide } from "@/components/tools/enclosure-size";
import { ToolPage } from "@/components/tools/tool-page";
import { createClient } from "@/lib/supabase/server";
import { unitSystemFor } from "@/lib/units";

export const metadata: Metadata = {
  title: "Reptile Enclosure Size Guide: Ball Python, Leopard Gecko, Bearded Dragon & More | Reptilytics",
  description: "Minimum and recommended enclosure sizes for adult ball pythons, corn snakes, boas, leopard geckos, crested geckos, bearded dragons and more, in feet, cm and gallons.",
  alternates: { canonical: "/tools/enclosure-size" },
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.rpc("fn72_my_profile").single()
    : { data: null };

  return (
    <ToolPage
      href="/tools/enclosure-size"
      title="Enclosure size guide"
      intro="Minimum and recommended enclosure sizes for adult reptiles."
      about={
        <>
          <h2 className="text-xl font-semibold">Why bigger is better</h2>
          <p>
            Modern husbandry favours enclosures large enough for a proper temperature gradient, room to stretch out and climb, and
            enough hides and clutter that animals feel secure. A common rule of thumb for terrestrial snakes is an enclosure at least
            as long as the snake; arboreal species like crested geckos and carpet pythons need height more than floor space.
          </p>
          <p>
            Babies and juveniles can start smaller and move up as they grow, but an adult-sized enclosure that is well furnished
            with hides is fine from the start for most species. Gallon figures are approximate and assume a rectangular enclosure.
          </p>
        </>
      }
    >
      <EnclosureSizeGuide defaultMetric={unitSystemFor(profile) === "metric"} />
    </ToolPage>
  );
}
