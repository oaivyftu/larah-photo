import { PageShell } from "@/components/layout/PageShell/PageShell";
import { services } from "@/data/services";
import { featuredWorkProjects } from "@/data/work";
import { HomeExperience } from "./HomeExperience";

export default function Home() {
  return (
    <PageShell variant="home">
      <HomeExperience
        projects={featuredWorkProjects.slice(0, 6)}
        services={services}
      />
    </PageShell>
  );
}
