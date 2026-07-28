import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getServicePage, getServices } from "@/sanity/fetchers";
import { ServiceExperience } from "./ServiceExperience";

export default async function ServicePage() {
  const [content, services] = await Promise.all([getServicePage(), getServices()]);

  return (
    <PageShell variant="service">
      <ServiceExperience content={content} services={services} />
    </PageShell>
  );
}
