import type { createClient } from "./server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const PAGE = 1000; // PostgREST's default row cap
const ID_BATCH = 100; // keeps the key=in.(…) filter well under URL limits

// Every row of `table` whose `key` is one of `ids`, in id batches and pages
// (ordered by id too, so pages never overlap or skip rows).
export async function fetchAll<T>(supabase: Supabase, table: string, columns: string, ids: string[], key: string, order: string): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += ID_BATCH) {
    const batch = ids.slice(i, i + ID_BATCH);
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass fixed table and column lists
        .from(table as any)
        .select(columns)
        .in(key, batch)
        .order(order)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      out.push(...(data as T[]));
      if (!data || data.length < PAGE) break;
    }
  }
  return out;
}
