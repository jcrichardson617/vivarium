"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect } from "react";

const SKIP_KEY = "rl_skip_analytics";

function skipped() {
  try {
    return localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

// Vercel Web Analytics, minus the team's own visits. Admins and moderators are
// never counted while signed in, and once one has signed in on a browser that
// browser stays uncounted after signing out too.
export function SiteAnalytics({ staff }: { staff: boolean }) {
  useEffect(() => {
    if (!staff) return;
    try {
      localStorage.setItem(SKIP_KEY, "1");
    } catch {}
  }, [staff]);

  if (staff) return null;
  return <Analytics beforeSend={(event) => (skipped() ? null : event)} />;
}
