import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = { title: "Privacy Policy | Reptilytics" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy" updated="October 14, 2026">
      <p>
        This policy explains what information Reptilytics collects, how we use it, and the choices you have. In short:
        your records are private by default, we never sell your data, and community features only use anonymized,
        combined statistics.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email address and password. Passwords are stored securely hashed by our
          authentication provider and are never visible to us.
        </li>
        <li>
          <strong>Profile:</strong> your username, display name, and optional country and unit preference.
        </li>
        <li>
          <strong>Your records:</strong> the animals, husbandry logs, enclosures, breeding records, genetics, notes and
          photos you add.
        </li>
        <li>
          <strong>Purchase details you choose to record</strong> (such as price and source). These are visible only to
          you, and are not shared with later owners of the animal.
        </li>
        <li>
          <strong>Technical data:</strong> basic logs our hosting providers keep to run and secure the service, such as IP
          address and browser type.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the service: store your records, sign you in, and show your data back to you.</li>
        <li>
          To produce <strong>anonymized, combined statistics</strong>, such as average growth for a species. These are
          only shown when enough keepers contribute that no individual can be identified.
        </li>
        <li>
          To show <strong>which gear is popular</strong> for each species (for example, &ldquo;used by 12 ball python
          keepers&rdquo;), based on the gear you add to your enclosures. Only totals are shown, only once at least 5
          keepers use a product, and never who uses it. You can opt out in Settings.
        </li>
        <li>To contact you about your account or important changes to the service.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use advertising trackers.</p>
      <p>
        Some product links are affiliate links: if you buy through them, Reptilytics may earn a small commission at no
        extra cost to you. The retailer sees that you came from Reptilytics, but we don&apos;t share your account or
        records with them, and commissions never affect which products are shown or how they are ranked.
      </p>

      <h2>Who can see your records</h2>
      <p>
        Animals are private by default. If you mark an animal as public, its profile, photos and genetics can be seen by
        anyone, along with your username. When you transfer an animal to another keeper, they receive its history from
        that point onward, but not your private purchase details.
      </p>

      <h2>Service providers</h2>
      <p>We use trusted providers to run Reptilytics. They process data only on our behalf:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: database, sign-in and photo storage
        </li>
        <li>
          <strong>Vercel</strong>: website hosting
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>We only use cookies that are needed to keep you signed in. We do not use advertising or tracking cookies.</p>
      <p>
        We count page visits with Vercel Web Analytics, which uses no cookies and does not identify you. It records the
        page, the referring site, and your country, browser and device type, in aggregate only.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit or delete your records at any time.</li>
        <li>You can stop your gear from counting toward the anonymous &ldquo;popular gear&rdquo; totals in Settings.</li>
        <li>
          You can delete your account at any time from Settings, or ask for a copy of your data by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>When you delete your account</h2>
      <p>
        We delete your login, email address, profile, photos, free-text notes and purchase details. Husbandry records
        (species, sex, dates, genetics, lineage, weights, feedings, sheds, health events and enclosure readings) are kept
        in anonymized form to support research and community statistics. They are no longer linked to you or visible in
        the app.
      </p>

      <h2>Children</h2>
      <p>Reptilytics is not intended for children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        If we make significant changes to this policy, we will update the date above and let account holders know.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </ProsePage>
  );
}
