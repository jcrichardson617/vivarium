import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const DESCRIPTION =
  "The record-keeping hub for reptile and amphibian keepers and breeders. Log feedings, weights and sheds, track genetics and lineage, and learn from community data.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Reptilytics | Intelligence for Modern Herpetoculture",
  description: DESCRIPTION,
  applicationName: "Reptilytics",
  keywords: ["reptile tracker", "reptile care log", "ball python morphs", "herp record keeping", "reptile breeding software", "amphibian care"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Reptilytics",
    title: "Reptilytics | Intelligence for Modern Herpetoculture",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Reptilytics", statusBarStyle: "default" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isModerator = profile?.role === "moderator" || profile?.role === "admin";

  return (
    <html lang="en">
      <body className={`${geistSans.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <header className="border-b border-border bg-card">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.png" alt="" width={28} height={28} />
              Reptilytics
              <span className="rounded-full border border-brand/40 bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wider text-brand">
                Beta
              </span>
            </Link>
            {user ? (
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
                <Link href="/animals" className="hover:text-brand">
                  My animals
                </Link>
                <Link href="/enclosures" className="hover:text-brand">
                  Enclosures
                </Link>
                <Link href="/breeding" className="hover:text-brand">
                  Breeding
                </Link>
                {isModerator && (
                  <Link href="/admin/library" className="hover:text-brand">
                    Admin
                  </Link>
                )}
                <Link href="/settings" className="hover:text-brand">
                  Settings
                </Link>
                <form action={signOut}>
                  <button className="text-muted hover:text-foreground">Sign out</button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/species" className="hover:text-brand">Species</Link>
                <Link href="/tools" className="hover:text-brand">Tools</Link>
                <Link href="/login" className="font-medium hover:text-brand">Sign in</Link>
              </div>
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter signedIn={!!user} />
      </body>
    </html>
  );
}
