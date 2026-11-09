"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown in place of a page that threw while rendering, instead of Next's bare
// "Application error" screen. The rest of the site (header, nav) keeps working.
export function ErrorFallback({ error, reset, home = "/" }: { error: Error & { digest?: string }; reset: () => void; home?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Something went wrong on this page</h1>
      <p className="text-muted">
        The rest of Reptilytics still works. Try again, and if it keeps happening, let us know what you were doing.
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href={home} className="btn-secondary">
          Go back
        </Link>
      </div>
      {error.digest && <p className="text-xs text-muted">Error reference: {error.digest}</p>}
    </section>
  );
}
