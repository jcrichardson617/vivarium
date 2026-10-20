import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/animals", label: "Animals" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/notes", label: "NH notes" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/species", label: "Species requests" },
  { href: "/admin/requests", label: "Feature requests" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/traffic", label: "Traffic" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
      {TABS.map((t) =>
        t.href === current ? (
          <span key={t.href} className="font-semibold">{t.label}</span>
        ) : (
          <Link key={t.href} href={t.href} className="text-muted hover:text-foreground">{t.label}</Link>
        ),
      )}
    </div>
  );
}
