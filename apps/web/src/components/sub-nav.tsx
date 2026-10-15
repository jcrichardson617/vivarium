"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const APP: Item[] = [
  { href: "/animals", label: "My animals" },
  { href: "/enclosures", label: "Enclosures" },
  { href: "/breeding", label: "Breeding" },
];

const EXPLORE: Item[] = [
  { href: "/species", label: "Species" },
  { href: "/research", label: "Research" },
  { href: "/genetics", label: "Genetics calculator" },
  { href: "/tools", label: "Free tools" },
];

// Second header row: where to go. Scrolls sideways on narrow screens.
export function SubNav({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const isActive = (href: string) =>
    path === href || path.startsWith(`${href}/`);

  const link = (item: Item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive(item.href) ? "page" : undefined}
      className={`whitespace-nowrap border-b-2 py-2 transition ${
        isActive(item.href) ? "border-brand font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );

  return (
    <div className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-4xl items-center gap-5 overflow-x-auto px-4 text-sm">
        {signedIn && (
          <>
            {APP.map(link)}
            <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
          </>
        )}
        {EXPLORE.map(link)}
      </nav>
    </div>
  );
}
