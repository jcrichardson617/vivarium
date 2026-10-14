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

- **Google sign-in** (code is ready, hidden): from a non-work computer, create a
  Google OAuth client (Web application) with redirect URI
  `https://megvsfrjvmjpujarjksx.supabase.co/auth/v1/callback`, paste its ID and
  secret into Supabase → Authentication → Providers → Google, then set
  `NEXT_PUBLIC_GOOGLE_SIGN_IN=true` in Vercel and redeploy.
- Turn on leaked-password protection in Supabase → Authentication (requires
  the Supabase Pro plan).
- Before launch: send app emails (sign-up, password reset, reminders) through
  Resend from noreply@reptilytics.com. Supabase's built-in email only allows a
  few messages per hour.
- Review the 49 seeded ball python genes and mark them verified.
- Move hosting to a commercial-use plan (or Cloudflare) before charging users.
