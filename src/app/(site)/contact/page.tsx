import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import { getContactPage, getSiteSettings } from "@/sanity/fetchers";
import {
  buildBreadcrumbSchema,
  buildContactPageSchema,
} from "@/utils/structuredData";
import { ContactExperience } from "./ContactExperience";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return pageMetadata({
    title: "Contact",
    description:
      `Enquire about a photography session with Larah Photo in ` +
      `${settings.location}. Reach the studio at ${settings.email} or ` +
      `${settings.phone}.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getContactPage(),
    getSiteSettings(),
  ]);

  return (
    <PageShell variant="contact">
      <JsonLd data={buildContactPageSchema(settings)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
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
