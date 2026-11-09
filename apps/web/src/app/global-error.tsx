"use client";

import { useEffect } from "react";

// Last resort when the root layout itself fails. It replaces the whole document,
// so it can't rely on the site's stylesheet.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "64px auto", padding: "0 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24 }}>Reptilytics hit a problem</h1>
        <p style={{ color: "#666" }}>Please try again in a moment.</p>
        <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" }}>
          Try again
        </button>
        {error.digest && <p style={{ fontSize: 12, color: "#888" }}>Error reference: {error.digest}</p>}
      </body>
    </html>
  );
}
