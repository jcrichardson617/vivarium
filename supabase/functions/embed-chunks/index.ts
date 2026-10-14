// Embeds research passages that have no embedding yet, using the gte-small
// model built into Supabase Edge Runtime (384 dimensions, normalized). Marks a
// document ready once all its passages are embedded.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Each call has a small CPU allowance (about 7 passages), so batches stay small
// and pg_cron calls this every 20 seconds.
const BATCH = 5;
const TIME_BUDGET_MS = 15_000;

const model = new Supabase.ai.Session("gte-small");
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  const started = Date.now();
  const { data: chunks, error } = await admin
    .from("research_chunks")
    .select("id, document_id, content")
    .is("embedding", null)
    .order("id")
    .limit(BATCH);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let embedded = 0;
  const touched = new Set<string>();
  for (const c of chunks ?? []) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const embedding = (await model.run(c.content, { mean_pool: true, normalize: true })) as number[];
    const { error: updateError } = await admin
      .from("research_chunks")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", c.id);
    if (updateError) return Response.json({ error: updateError.message, embedded }, { status: 500 });
    embedded++;
    touched.add(c.document_id);
  }

  // Documents whose passages are now all embedded are searchable. (A paper queued
  // for full text is searchable by its abstract meanwhile.)
  let ready = 0;
  for (const id of touched) {
    const [{ count: pending }, { count: total }] = await Promise.all([
      admin.from("research_chunks").select("id", { count: "exact", head: true }).eq("document_id", id).is("embedding", null),
      admin.from("research_chunks").select("id", { count: "exact", head: true }).eq("document_id", id),
    ]);
    if (pending === 0) {
      await admin
        .from("research_documents")
        .update({ ingest_status: "ready", chunk_count: total ?? 0 })
        .eq("id", id);
      ready++;
    }
  }
  return Response.json({ embedded, ready, ms: Date.now() - started });
});
