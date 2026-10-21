# Reptilytics email format

How every email from Reptilytics is written and laid out. The ready-made outreach emails are in
[outreach.md](outreach.md); this file is the house format they follow, so new emails match.

## Sending

- Send from **Admin → Email** on reptilytics.com. It goes out from `Reptilytics <info@reptilytics.com>`
  and replies come back to info@reptilytics.com (forwarded to Gmail).
- **Plain text, sent exactly as written.** No Markdown: `**bold**` and `[links](...)` show up
  literally. Every line break you type becomes a line break in the email.
- **When copying from outreach.md, join each paragraph into one line.** The templates are wrapped
  at ~100 characters for readability here; pasted as-is, those breaks make ragged lines on phones.
- Leave one blank line between paragraphs. Paste URLs in full (`https://www.reptilytics.com/...`);
  mail apps make them clickable.
- No attachments. Subject up to 200 characters, message up to 20,000.
- Status shows in the Sent list (Pending → Sent → Delivered → Opened, or Bounced / Marked as spam).
  Opens are approximate: some mail apps block the tracking image.

## Structure

```
Subject: <short, specific, sentence case>

Hi <Name>,                     ← "Hi Dr. <Name>," for vets and academics

<1–2 sentences about them: something specific from their site, animals or work.>

<What Reptilytics is, in their terms — see the standard description below.>

<The ask: one clear request, e.g. add us to your resources page / answer a few questions.>

https://www.reptilytics.com/<the page that helps them>     ← on its own line

<Optional: 1–3 numbered questions, then "Even one-line answers help a lot.">

<One closing line inviting feedback.>

Thanks,                        ← or "Best," / "Cheers," to match the tone
The Reptilytics Team
https://www.reptilytics.com
```

Add `info@reptilytics.com` under the signature when writing through a contact form, since the
reply address won't be visible to them.

## Rules

- **Personalise every email.** Their name and one genuine, specific detail. Never mass-send.
- **One link is best, two at most.** Link to the page that helps *that* audience, not just the
  home page (see the audience table in outreach.md).
- **Short.** 120–250 words. One idea per paragraph, 2–4 sentences each.
- **Questions are numbered**, at most three, and easy to answer in a line.
- **Voice:** "we", friendly and plain. Say "free" where it's true. No hype words ("revolutionary",
  "game-changing"), no exclamation-mark chains, no emoji.
- **Name things consistently:** Reptilytics (one word, capital R), "reptile and amphibian keepers
  and breeders", "morph genetics calculator", "research library".
- **Sign as "The Reptilytics Team".**
- **Follow up once**, ~10 days later, with subject `Re: <original subject>` and two lines. Then stop.

## Standard description

Reuse and trim to fit the audience:

> We've built Reptilytics, a free record-keeping site for reptile and amphibian keepers and
> breeders. Keepers log feedings, weights, sheds and health notes for each animal, get reminders
> when an animal is due to eat, track their enclosures, and follow breeding projects from pairing
> through clutches to hatchlings.

Free tools (no account needed): morph genetics calculator (`/genetics`), prey-size, hatch-date
and enclosure-size calculators (`/tools`), and a research library of published papers for over
180 species (`/research`, `/species/<species-slug>`).

## Automatic emails

Welcome and weekly-digest emails are built in `supabase/functions/send-emails/index.ts`, not
written by hand. They share one HTML layout (`layout()` there): a bold "Reptilytics" header, a
560px-wide body in the system font at 15px, and a small grey footer with a link to the site.
The digest footer also carries the unsubscribe link and a link to Settings, and the email sends
one-click `List-Unsubscribe` headers. Outbox emails from Admin → Email skip this layout and
are sent as plain text in the same font.
