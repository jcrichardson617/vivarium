import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} | Reptilytics` };
}

export default async function KeeperPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const { data: animals } = await supabase.rpc("fn38_public_animals_for_keeper", { p_username: profile.username });
  const paths = (animals ?? []).map((a) => a.photo_path).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from("animal-photos").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl ?? undefined]));
  const name = profile.display_name && profile.display_name !== "New User" ? profile.display_name : profile.username;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="text-muted">
          @{profile.username} · Member since {new Date(profile.created_at ?? Date.now()).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
      </header>

      {!animals?.length && <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">No public animals yet.</p>}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {animals?.map((a) => (
          <li key={a.id}>
            <Link href={`/a/${a.id}`} className="block overflow-hidden rounded-lg border border-border bg-card transition hover:border-brand">
              {a.photo_path && urls.get(a.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls.get(a.photo_path)} alt={a.name ?? ""} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-background text-4xl" aria-hidden="true">🦎</div>
              )}
              <div className="p-3">
                <p className="font-semibold">{a.name ?? "Unnamed"}</p>
                <p className="text-xs text-muted">{a.common_name ?? "Unknown species"}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
