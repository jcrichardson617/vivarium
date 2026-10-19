"use client";

import { useState } from "react";

export function ShareButton({
  url,
  title,
  label = "Share",
  className = "text-brand hover:underline",
}: {
  url: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "Link copied ✓" : label}
    </button>
  );
}
