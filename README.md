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

- **Search Console:** after each indexing fix goes live, resubmit `https://www.reptilytics.com/sitemap.xml` under Sitemaps and request indexing for key pages in URL inspection. Check Indexing → Pages a week later for the not-indexed reasons. Still to do: Bing Webmaster Tools → Import from Google Search Console.
- **OpenAlex API key (optional):** the harvester already works without one (6,700+ OpenAlex papers so far). A free key from https://openalex.org/settings/api, saved as Supabase → Edge Functions → Secrets → `OPENALEX_API_KEY`, only raises the daily request budget.
- **Comparison page** (`/compare/reptile-husbandry-apps`): re-check competitors' features and prices every few months and update the "checked" date.

- **Google sign-in branding** (from home): the Google screen says "Sign in to
  megvsfrjvmjpujarjksx.supabase.co"; verified branding makes it say Reptilytics.
  In Google Cloud → Google Auth Platform → Branding, set app name `Reptilytics`,
  a 120×120 logo, home page `https://reptilytics.com`, privacy
  `https://reptilytics.com/privacy`, terms `https://reptilytics.com/terms`.
  reptilytics.com is already verified in Google Search Console, so the next
  step is Verify branding (Google takes ~2–3 business days).
  Paid alternative: Supabase custom domain (`auth.reptilytics.com`, Pro + $10/mo).
- Turn on leaked-password protection in Supabase → Authentication (requires
  the Supabase Pro plan).
- Review the seeded morph genes and mark them verified (as of Oct 23: 23 of 49
  ball python genes verified, and 47 of 126 genes across all species).
- Move hosting to a commercial-use plan (or Cloudflare) before charging users.

## HerpAtlas research library

Papers are harvested automatically into `research_documents` / `research_chunks`:

- `harvest-research` edge function (pg_cron, nightly: every 10 min from 07:00 to 07:50 UTC, one target per run) alternates between the next species and the next topic sweep (`research_harvest_topics`), pulling from Europe PMC. Each target is re-harvested every 30 days; with ~200 targets and 6 runs a night, a full pass takes about a month.
- `fetch-fulltext` adds full text for open-access papers under CC BY / CC BY-SA / CC0. Non-commercial (NC) and paywalled papers keep only their abstract. Paused (unscheduled) since it reached its 1,000-paper cap; see migration `20261020000100`.
- `harvest-openalex` (hourly, slowed from every 20 min until embedding catches up; set back to `'5-59/20 * * * *'` then) adds OpenAlex abstracts.
- `embed-chunks` (every 30 s, 5 passages a call, one paper at a time) embeds passages with Supabase's built-in gte-small model (384 dims). Every 20 s once starved sign-ins on the free plan, mostly because of a slow next-passages query (fixed in migration `20261020000100`); if sign-ins slow down again, set it back to every 2 min.
- `fn43_search_research` does hybrid (semantic + keyword) retrieval for Monty.
- Admin → Library shows progress and has run-now buttons.
- Herpetological Review Natural History Notes are added by hand in Admin → NH notes (paste citations, one per line). They are stored as summary-only documents (`external_source = 'herp_review'`): citation, topic, link to SSAR's PDF and our own summary, never the note text. They show on species pages and are searchable by Monty.

Later: semantic chunking (needs a faster/paid embedding API), care-sheet sources (only with permission, otherwise link + our own summary).
