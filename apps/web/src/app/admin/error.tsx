"use client";

import { ErrorFallback } from "@/components/error-fallback";

// Keeps a crash on one admin page from looking like the whole admin area is down.
export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} home="/admin" />;
}
