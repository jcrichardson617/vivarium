import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptTransfer, cancelTransfer, declineTransfer } from "./actions";

export const metadata: Metadata = { title: "Transfers | Reptilytics", robots: { index: false } };

type Transfer = {
  id: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined" | "cancelled";
  note: string | null;
  created_at: string;
  completed_at: string | null;
  animal_id: string;
  animal_name: string | null;
  sex: string | null;
  hatch_date: string | null;
  species_common_name: string | null;
  species_scientific_name: string | null;
  other_username: string;
  other_display_name: string | null;
};

const STATUS_CLASS: Record<Transfer["status"], string> = {
  pending: "bg-accent/15 text-accent-ink",
  accepted: "bg-brand/10 text-brand-dark",
  declined: "bg-red-500/10 text-red-600",
  cancelled: "bg-border text-muted",
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

function Keeper({ t }: { t: Transfer }) {
  return (
    <Link href={`/u/${t.other_username}`} className="text-brand hover:underline">
      {t.other_display_name && t.other_display_name !== t.other_username
        ? `${t.other_display_name} (@${t.other_username})`
        : `@${t.other_username}`}
    </Link>
  );
}

function Animal({ t, link }: { t: Transfer; link: boolean }) {
  const name = t.animal_name ?? "Unnamed";
  const details = [t.species_common_name ?? t.species_scientific_name, t.sex && t.sex !== "unknown" ? t.sex : null, t.hatch_date ? `hatched ${fmt(t.hatch_date)}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="min-w-0">
      {link ? (
        <Link href={`/animals/${t.animal_id}`} className="font-semibold hover:text-brand">{name}</Link>
      ) : (
        <span className="font-semibold">{name}</span>
      )}
      {details && <p className="text-sm text-muted">{details}</p>}
    </div>
  );
}

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const { data, error: loadError } = await supabase.rpc("fn64_my_transfers");
  if (loadError) return <p className="text-red-600">Could not load transfers: {loadError.message}</p>;
  const all = (data ?? []) as Transfer[];

  const incoming = all.filter((t) => t.direction === "incoming" && t.status === "pending");
  const outgoing = all.filter((t) => t.direction === "outgoing" && t.status === "pending");
  const history = all.filter((t) => t.status !== "pending");

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Transfers</h1>
        <p className="text-sm text-muted">
          Sold, traded or rehomed an animal? Send it to the new keeper from its page and its full history goes with it.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Waiting for you</h2>
        {!incoming.length && <p className="text-sm text-muted">No animals waiting for you.</p>}
        <ul className="flex flex-col gap-3">
          {incoming.map((t) => (
            <li key={t.id} className="rounded-lg border border-border border-l-4 border-l-accent bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Animal t={t} link={false} />
                <div className="flex gap-2">
                  <form action={acceptTransfer}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="animal_id" value={t.animal_id} />
                    <button className="btn-primary">Accept</button>
                  </form>
                  <form action={declineTransfer}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-secondary">Decline</button>
                  </form>
                </div>
              </div>
              <p className="mt-2 text-sm">From <Keeper t={t} /> · sent {fmt(t.created_at)}</p>
              {t.note && <p className="mt-2 whitespace-pre-line border-l-2 border-border pl-3 text-sm text-muted">{t.note}</p>}
              <p className="mt-2 text-xs text-muted">
                Accepting adds it to My animals with its feedings, weights, sheds, health events and notes. Their tags and enclosure stay with them.
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Sent, waiting on them</h2>
        {!outgoing.length && (
          <p className="text-sm text-muted">
            Nothing pending. To send one, open the animal in <Link href="/animals" className="text-brand hover:underline">My animals</Link> and use Transfer.
          </p>
        )}
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card empty:hidden">
          {outgoing.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Animal t={t} link />
                <p className="text-sm">To <Keeper t={t} /> · sent {fmt(t.created_at)}</p>
              </div>
              <form action={cancelTransfer}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-sm text-red-600 hover:underline">Cancel</button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Last 90 days</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {history.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <span className="font-medium">{t.animal_name ?? "Unnamed"}</span>{" "}
                  <span className="text-muted">
                    {t.direction === "incoming" ? "from" : "to"} <Keeper t={t} />
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <time dateTime={t.completed_at ?? t.created_at}>{fmt(t.completed_at ?? t.created_at)}</time>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLASS[t.status]}`}>{t.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
