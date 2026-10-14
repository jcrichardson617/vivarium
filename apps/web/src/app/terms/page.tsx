import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = { title: "Terms of Service | Reptilytics" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms of Service" updated="October 14, 2026">
      <p>
        These terms apply when you use Reptilytics. By creating an account or using the site, you agree to them. If you
        do not agree, please do not use Reptilytics.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old to use Reptilytics.</li>
        <li>Keep your password secure. You are responsible for activity on your account.</li>
        <li>Provide accurate information, and do not create accounts for other people without their permission.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the records, notes and photos you add. You give Reptilytics permission to store and display them as
        needed to run the service, and to include them in anonymized, combined statistics as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>. Only upload photos and content you have the right to share.
      </p>

      <h2>Acceptable use</h2>
      <p>Please do not:</p>
      <ul>
        <li>Upload unlawful, abusive or misleading content, or content that infringes someone else&apos;s rights</li>
        <li>Use Reptilytics to advertise or trade in animals illegally</li>
        <li>Try to access other people&apos;s accounts or private records, or disrupt the service</li>
        <li>Scrape or copy the site or its data in bulk without permission</li>
      </ul>

      <h2>Not veterinary advice</h2>
      <p>
        Care information, benchmarks, research summaries and insights on Reptilytics are for general information only.
        They are not a substitute for advice from a qualified reptile veterinarian. Always consult a vet about your
        animal&apos;s health.
      </p>

      <h2>Availability</h2>
      <p>
        We work to keep Reptilytics running and your data safe, but the service is provided &quot;as is&quot;, without
        guarantees that it will always be available or error-free. We recommend keeping your own copies of important
        records.
      </p>

      <h2>Paid features</h2>
      <p>
        Some features may require a paid plan in the future. Any prices and terms will be shown clearly before you are
        charged.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using Reptilytics and ask us to delete your account at any time. We may suspend accounts that break
        these terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent allowed by law, Reptilytics is not liable for indirect or consequential losses, or for any loss
        arising from decisions made using information on the site.
      </p>

      <h2>Changes to these terms</h2>
      <p>If we make significant changes, we will update the date above and let account holders know.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </ProsePage>
  );
}
