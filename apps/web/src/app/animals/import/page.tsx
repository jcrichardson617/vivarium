import type { Metadata } from "next";
import Link from "next/link";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Import from CSV | Reptilytics" };

export default function ImportPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Import from CSV</h1>
      <p className="mb-6 text-sm text-muted">
        Bring in animals and their logs from a spreadsheet or another app. Files exported from{" "}
        <Link href="/settings#export" className="text-brand hover:underline">Settings</Link> import as they are; other
        spreadsheets work when their column names are close to ours.
      </p>

      <ImportForm />

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer font-medium">What the files should look like</summary>
        <div className="mt-3 flex flex-col gap-3 text-muted">
          <p>One table per file, with a header row. Upload several files at once; animals are added before their logs.</p>
          <p>
            <strong className="text-foreground">Animals</strong> need a <code>name</code> (or <code>animal_code</code>) and a{" "}
            <code>species</code> or <code>scientific_name</code> from our species list. Optional: <code>sex</code>,{" "}
            <code>hatch_date</code>, <code>status</code>, <code>tags</code>, <code>feeding_interval_days</code>,{" "}
            <code>sire</code>, <code>dam</code>, <code>acquired_date</code>, <code>source</code>, <code>price</code>,{" "}
            <code>currency</code>. A <code>morph</code> is saved as a note; add genes on each animal afterwards.
          </p>
          <p>
            <strong className="text-foreground">Logs</strong> need the animal (<code>animal_code</code> or <code>animal_name</code>)
            and a date, plus the columns for their kind: <code>feeder_type</code> for feedings, <code>weight_g</code> for
            weights, <code>length_cm</code> for lengths, <code>shed_date</code> for sheds, <code>event_type</code> for health,{" "}
            <code>note_text</code> for notes.
          </p>
          <p>
            Dates can be 2024-06-30 or 6/30/2024. Weights are grams and lengths are cm. Animals already in your collection
            and logs already recorded are skipped, so importing the same file twice is safe.
          </p>
        </div>
      </details>
    </section>
  );
}
