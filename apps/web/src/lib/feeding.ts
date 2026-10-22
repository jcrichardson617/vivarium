import type { createClient } from "@/lib/supabase/server";

const DAY = 86400000;

// Keepers can turn feeding schedules off for the whole account in Settings.
// When off, nothing is ever due: no badges, due lists or reminder nudges.
export async function feedingSchedulesOn(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.rpc("fn79_my_feeding_schedules");
  return data ?? true;
}

export type FeedingDue = { days: number; label: string; tone: "overdue" | "today" | "soon" | "later" };

// When the next meal is due, from the last accepted feeding and the keeper's interval.
export function feedingDue(lastFedAt: string | null | undefined, intervalDays: number | null | undefined): FeedingDue | null {
  if (!intervalDays) return null;
  if (!lastFedAt) return { days: 0, label: "Due to eat", tone: "today" };
  const due = new Date(lastFedAt).getTime() + intervalDays * DAY;
  const days = Math.round((startOfDay(due) - startOfDay(Date.now())) / DAY);
  if (days < 0) return { days, label: `Overdue ${-days} day${days === -1 ? "" : "s"}`, tone: "overdue" };
  if (days === 0) return { days, label: "Due today", tone: "today" };
  if (days === 1) return { days, label: "Due tomorrow", tone: "soon" };
  return { days, label: `Due in ${days} days`, tone: "later" };
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const DUE_TONE_CLASS: Record<FeedingDue["tone"], string> = {
  overdue: "bg-red-500/10 text-red-600",
  today: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  soon: "bg-brand/10 text-brand-dark",
  later: "bg-border/60 text-muted",
};
