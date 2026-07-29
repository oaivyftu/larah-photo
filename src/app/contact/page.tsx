import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getContactPage, getServices } from "@/sanity/fetchers";
import { ContactExperience } from "./ContactExperience";

export default async function ContactPage() {
  const [content, services] = await Promise.all([
    getContactPage(),
    getServices(),
  ]);

  return (
    <PageShell variant="contact">
      <ContactExperience
        content={content}
        sessionTypes={services.map((service) => service.title)}
      />
    </PageShell>
  );
}
