import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// One-click unsubscribe (RFC 8058): mail apps POST here from the
// List-Unsubscribe header of the weekly digest.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Bad token", { status: 400 });
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { error } = await supabase.rpc("fn56_unsubscribe", { p_token: token });
  return new Response(error ? "Error" : "Unsubscribed", { status: error ? 500 : 200 });
}
