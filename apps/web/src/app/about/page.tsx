import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "About | Reptilytics" };

export default function AboutPage() {
  return (
    <ProsePage title="About Reptilytics">
      <p>
        Reptilytics exists to help reptile keepers make better husbandry and breeding decisions through data, research
        and community knowledge.
      </p>
      <h2>Why we built it</h2>
      <p>
        Reptile knowledge is scattered across forums, social groups, breeder websites, videos and personal notebooks.
        Keepers often make decisions based on limited experience or conflicting advice, and years of valuable growth,
        feeding and breeding records end up lost in spreadsheets.
      </p>
      <p>
        Reptilytics gives keepers one place to record their animals, and turns those records, combined with published
        research, into useful answers for everyone.
      </p>
      <h2>How it fits together</h2>
      <ul>
        <li>
          <strong>Reptilytics</strong> is the app: your collection, husbandry logs, breeding projects and genetics.
        </li>
        <li>
          <strong>HerpAtlas</strong> is the data layer: anonymized community records and source-linked research that power
          search, benchmarks and insights.
        </li>
        <li>
          <strong>Monty</strong> (coming soon) is an AI assistant that draws on HerpAtlas and your own records to answer
          questions, always citing its sources.
        </li>
      </ul>
      <h2>Our principles</h2>
      <ul>
        <li>Your private records stay private. Community comparisons only ever use anonymized, combined data.</li>
        <li>Community observations are kept separate from published science, and every source is linked.</li>
        <li>Useful record-keeping is free.</li>
      </ul>
      <p>
        Have an idea or found a problem? <Link href="/contact">Get in touch</Link>.
      </p>
    </ProsePage>
  );
}
