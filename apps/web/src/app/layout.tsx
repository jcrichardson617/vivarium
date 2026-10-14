import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reptilytics",
  description: "Intelligence for modern herpetoculture.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <header className="border-b border-border bg-card">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.png" alt="" width={28} height={28} />
              Reptilytics
            </Link>
            {user ? (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/animals" className="hover:text-brand">
                  My animals
                </Link>
                <form action={signOut}>
                  <button className="text-muted hover:text-foreground">Sign out</button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm hover:text-brand">
                Sign in
              </Link>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
