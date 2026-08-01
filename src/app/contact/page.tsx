import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getContactPage, getSiteSettings } from "@/sanity/fetchers";
import { ContactExperience } from "./ContactExperience";

export const metadata: Metadata = {
  title: "Contact",
  description: "Enquire about a photography session with Larah Photo.",
};

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getContactPage(),
    getSiteSettings(),
  ]);

  return (
    <PageShell variant="contact">
      <ContactExperience
        contactDetails={{
          email: settings.email,
          instagramUrl: settings.instagramUrl,
          phone: settings.phone,
        }}
        content={content}
      />
    </PageShell>
  );
}
