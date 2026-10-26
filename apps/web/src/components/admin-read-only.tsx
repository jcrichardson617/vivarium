import Link from "next/link";

// Shown on admin pages that mirror a keeper's own pages: what you see is theirs, and nothing here can change it.
export function AdminReadOnly({ username, userId }: { username?: string | null; userId?: string | null }) {
  return (
    <p className="mt-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      👁️ Admin view of{" "}
      {userId ? (
        <Link href={`/admin/users/${userId}`} className="text-brand hover:underline">@{username ?? "unknown"}</Link>
      ) : (
        <span>@{username ?? "unknown"}</span>
      )}
      &apos;s data <span className="text-muted">· read only</span>
    </p>
  );
}
