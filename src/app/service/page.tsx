import { PageShell } from "@/components/layout/PageShell/PageShell";
import { services } from "@/data/services";
import { ServiceExperience } from "./ServiceExperience";

export default function ServicePage() {
  return (
    <PageShell variant="service">
      <ServiceExperience services={services} />
    </PageShell>
  );
}
