import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = { title: "Contact | Reptilytics", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <ProsePage title="Contact us">
      <p>Questions, comments, suggestions or bug reports? We read everything.</p>
      <p className="text-lg">
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <h2>Helpful details to include</h2>
      <ul>
        <li>The email address on your Reptilytics account</li>
        <li>What you were trying to do, and what happened instead</li>
        <li>A screenshot, if something looks wrong</li>
      </ul>
      <p>
        To request a copy of your data or to delete your account, email us from the address on your account and we will
        take care of it.
      </p>
    </ProsePage>
  );
}
