import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Unsubscribe | Reptilytics", robots: { index: false } };

const UUID = /^[0-9a-f-]{36}$/i;
const WHAT = ["all", "feeding", "research", "species"] as const;
type What = (typeof WHAT)[number];

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const what = String(formData.get("what") ?? "all");
  const species = String(formData.get("s") ?? "");
  const supabase = await createClient();
  const { data } = UUID.test(token)
    ? await supabase.rpc("fn75_unsubscribe", {
        p_token: token,
        p_what: (WHAT as readonly string[]).includes(what) ? what : "all",
        p_species_id: UUID.test(species) ? species : undefined,
      })
    : { data: false };
  redirect(`/unsubscribe?done=${data ? "1" : "0"}&what=${encodeURIComponent(what)}${UUID.test(species) ? `&s=${species}` : ""}`);
}

// The digest links here. Unsubscribing takes a click, so link scanners that
// open the link don't unsubscribe anyone.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string; what?: string; s?: string }>;
}) {
  const { t, done, what: rawWhat, s } = await searchParams;
  const what: What = (WHAT as readonly string[]).includes(rawWhat ?? "") ? (rawWhat as What) : "all";
  let speciesName = "this species";
  if (what === "species" && s && UUID.test(s)) {
    const supabase = await createClient();
    const { data } = await supabase.from("species").select("common_name, scientific_name").eq("id", s).maybeSingle();
    if (data) speciesName = data.common_name ?? data.scientific_name;
  }

  const copy: Record<What, { question: string; button: string; done: string }> = {
    all: {
      question: "Stop the Monday email about feedings due and new research?",
      button: "Unsubscribe",
      done: "You're unsubscribed from the weekly digest.",
    },
    feeding: {
      question: "Stop feeding reminders in the Monday email? You'll still get research updates.",
      button: "Stop feeding reminders",
      done: "Feeding reminders are off.",
    },
    research: {
      question: "Stop research updates in the Monday email? You'll still get feeding reminders.",
      button: "Stop research updates",
      done: "Research updates are off.",
    },
    species: {
      question: `Stop research updates for ${speciesName}? You'll still hear about your other species.`,
      button: `Stop ${speciesName} research`,
      done: `You won't get research updates for ${speciesName}.`,
    },
  };
  const c = copy[what];

  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-4 text-2xl font-bold">Weekly digest</h1>
      {done === "1" ? (
        <p>
          {c.done} You can change what you get any time in{" "}
          <Link href="/settings" className="text-brand underline">Settings</Link>.
        </p>
      ) : done === "0" ? (
        <p>That link didn&apos;t work. Change your email choices in <Link href="/settings" className="text-brand underline">Settings</Link> instead.</p>
      ) : (
        <form action={unsubscribe} className="flex flex-col items-center gap-4">
          <input type="hidden" name="t" value={t ?? ""} />
          <input type="hidden" name="what" value={what} />
          {s && <input type="hidden" name="s" value={s} />}
          <p className="text-muted">{c.question}</p>
          <button className="btn-primary">{c.button}</button>
        </form>
      )}
    </section>
  );
}
