# Reptilytics

Intelligence for modern herpetoculture — reptilytics.com.

- **Reptilytics** — the platform (web app, collections, logging).
- **HerpAtlas** — the data layer (Supabase schema, analytics views, search index).
- **Monty** — the LLM assistant (later phase), built on HerpAtlas.

## Layout

- `supabase/migrations/` — every database change, in order. The first file is a
  baseline snapshot of the schema that was built in the Supabase dashboard; it is
  already applied to production and must not be re-run there.

## Platforms

Web (Next.js), plus iPhone and Android (Expo / React Native) from one monorepo
with shared types and Supabase calls. Security lives in the database (RLS +
functions), so every client gets the same rules.

## Plans (undecided)

- `profiles.plan` is set only by billing or an admin, never by the user.
- Today: `free` (3 photos per animal) and `premium` (10).
- Likely tiers later, e.g. a photos tier, and a higher tier with Monty access
  and 10 photos. Pricing not decided yet.

## To do later

- **Google sign-in branding** (from home): the Google screen says "Sign in to
  megvsfrjvmjpujarjksx.supabase.co"; verified branding makes it say Reptilytics.
  In Google Cloud → Google Auth Platform → Branding, set app name `Reptilytics`,
  a 120×120 logo, home page `https://reptilytics.com`, privacy
  `https://reptilytics.com/privacy`, terms `https://reptilytics.com/terms`. Prove
  ownership of reptilytics.com in Google Search Console (Domain property, TXT
  record in DNS), then click Verify branding (Google takes ~2–3 business days).
  Paid alternative: Supabase custom domain (`auth.reptilytics.com`, Pro + $10/mo).
- Turn on leaked-password protection in Supabase → Authentication (requires
  the Supabase Pro plan).
- Review the 49 seeded ball python genes and mark them verified.
- Move hosting to a commercial-use plan (or Cloudflare) before charging users.

## HerpAtlas research library

Papers are harvested automatically into `research_documents` / `research_chunks`:

- `harvest-research` edge function (pg_cron, nightly: every 10 min from 07:00 to 07:50 UTC, one target per run) alternates between the next species and the next topic sweep (`research_harvest_topics`), pulling from Europe PMC. Each target is re-harvested every 30 days; with ~200 targets and 6 runs a night, a full pass takes about a month.
- `fetch-fulltext` (every 2 min) adds full text for open-access papers under CC BY / CC BY-SA / CC0. Non-commercial (NC) and paywalled papers keep only their abstract.
- `embed-chunks` (every 2 min; was every 20 s, which starved sign-ins on the free plan) embeds passages with Supabase's built-in gte-small model (384 dims).
- `fn43_search_research` does hybrid (semantic + keyword) retrieval for Monty.
- Admin → Library shows progress and has run-now buttons.

Later: semantic chunking (needs a faster/paid embedding API), care-sheet sources (only with permission, otherwise link + our own summary).
