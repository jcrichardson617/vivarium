# Reptilytics

Intelligence for modern herpetoculture — reptilytics.com.

- **Reptilytics** — the platform (web app, collections, logging).
- **HerpAtlas** — the data layer (Supabase schema, analytics views, search index).
- **Monty** — the LLM assistant (later phase), built on HerpAtlas.

## Layout

- `supabase/migrations/` — every database change, in order. The first file is a
  baseline snapshot of the schema that was built in the Supabase dashboard; it is
  already applied to production and must not be re-run there.
