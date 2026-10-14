import Link from "next/link";

export const CONTACT_EMAIL = "info@reptilytics.com";

const LINKS = [
  { href: "/species", label: "Species" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 text-sm text-muted">
        <p>
          Questions, comments or suggestions? Let us know at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {signedIn && (
            <Link href="/feedback" className="font-medium text-brand hover:underline">
              Request a feature
            </Link>
          )}
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>&copy; {new Date().getFullYear()} Reptilytics. All rights reserved.</p>
      </div>
    </footer>
  );
}
