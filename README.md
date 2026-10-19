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

- **Search Console (check ~Oct 21):** Indexing → Pages: note indexed / not-indexed counts and the not-indexed reasons. Sitemaps: confirm `https://www.reptilytics.com/sitemap.xml` shows Success. URL inspection → Request indexing for `/`, `/features` and a species page. Then Bing Webmaster Tools → Import from Google Search Console.
- **OpenAlex API key:** get a free key at https://openalex.org/settings/api, then Supabase → Edge Functions → Secrets → `OPENALEX_API_KEY`. The OpenAlex harvester skips every run until it's set.
- **Review the comparison page** (`/compare/reptile-husbandry-apps`, noindex for now); once approved, remove the noindex and add it to the sitemap.

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

- `harvest-research` edge function (pg_cron, every 10 min) alternates between the next species and the next topic sweep (`research_harvest_topics`), pulling from Europe PMC. Each target is re-harvested every 30 days.
- `fetch-fulltext` (every 2 min) adds full text for open-access papers under CC BY / CC BY-SA / CC0. Non-commercial (NC) and paywalled papers keep only their abstract.
- `embed-chunks` (every 20 s) embeds passages with Supabase's built-in gte-small model (384 dims).
- `fn43_search_research` does hybrid (semantic + keyword) retrieval for Monty.
- Admin → Library shows progress and has run-now buttons.
- Herpetological Review Natural History Notes are added by hand in Admin → NH notes (paste citations, one per line). They are stored as summary-only documents (`external_source = 'herp_review'`): citation, topic, link to SSAR's PDF and our own summary, never the note text. They show on species pages and are searchable by Monty.

Later: semantic chunking (needs a faster/paid embedding API), care-sheet sources (only with permission, otherwise link + our own summary).
