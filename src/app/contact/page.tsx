import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getContactPage, getSiteSettings } from "@/sanity/fetchers";
import { ContactExperience } from "./ContactExperience";

export default async function ContactPage() {
  const [content, settings] = await Promise.all([
    getContactPage(),
    getSiteSettings(),
  ]);

  return (
    <PageShell variant="contact">
      <ContactExperience content={content} settings={settings} />
    </PageShell>
  );
}
