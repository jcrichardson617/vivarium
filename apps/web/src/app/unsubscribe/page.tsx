import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Unsubscribe | Reptilytics", robots: { index: false } };

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const supabase = await createClient();
  const { data } = /^[0-9a-f-]{36}$/i.test(token) ? await supabase.rpc("fn56_unsubscribe", { p_token: token }) : { data: false };
  redirect(`/unsubscribe?done=${data ? "1" : "0"}`);
}

// The digest links here. Unsubscribing takes a click, so link scanners that
// open the link don't unsubscribe anyone.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-4 text-2xl font-bold">Weekly digest</h1>
      {done === "1" ? (
        <p>You&apos;re unsubscribed. You can turn the digest back on any time in <Link href="/settings" className="text-brand underline">Settings</Link>.</p>
      ) : done === "0" ? (
        <p>That link didn&apos;t work. Turn the digest off in <Link href="/settings" className="text-brand underline">Settings</Link> instead.</p>
      ) : (
        <form action={unsubscribe} className="flex flex-col items-center gap-4">
          <input type="hidden" name="t" value={t ?? ""} />
          <p className="text-muted">Stop the Monday email about feedings due and new research?</p>
          <button className="btn-primary">Unsubscribe</button>
        </form>
      )}
    </section>
  );
}
