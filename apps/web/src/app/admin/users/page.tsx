import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users | Reptilytics" };

const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export default async function UsersAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (me?.role !== "admin") notFound();

  const { data: users, error } = await supabase.rpc("fn77_admin_users");
  const term = q?.trim().toLowerCase();
  const shown = (users ?? []).filter(
    (u) => !term || [u.username, u.display_name, u.email].some((v) => v?.toLowerCase().includes(term)),
  );
  const withAnimals = (users ?? []).filter((u) => u.animals > 0).length;
  const active = (users ?? []).filter((u) => u.logs_30d > 0).length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <AdminNav current="/admin/users" />
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted">
          {users?.length ?? 0} accounts · {withAnimals} with animals · {active} logged something in the last 30 days
        </p>
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search username, name or email" className="field flex-1" />
        <button className="btn-secondary">Search</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Last sign-in</th>
              <th className="p-3 text-right">Animals</th>
              <th className="p-3 text-right">Logs (30d)</th>
              <th className="p-3">Last log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <Link href={`/u/${u.username}`} className="font-medium hover:text-brand">@{u.username}</Link>
                  {u.display_name && u.display_name !== u.username && <span className="block text-xs text-muted">{u.display_name}</span>}
                  {(u.role !== "user" || u.plan !== "free") && (
                    <span className="block text-xs text-muted">{[u.role !== "user" ? u.role : null, u.plan !== "free" ? u.plan : null].filter(Boolean).join(" · ")}</span>
                  )}
                </td>
                <td className="p-3">
                  {u.email}
                  {!u.confirmed && <span className="ml-1 text-xs text-amber-600">(unconfirmed)</span>}
                </td>
                <td className="p-3 text-muted">{day(u.joined)}</td>
                <td className="p-3 text-muted">{day(u.last_sign_in)}</td>
                <td className="p-3 text-right">{u.animals}</td>
                <td className="p-3 text-right">{u.logs_30d}</td>
                <td className="p-3 text-muted">{day(u.last_log)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
