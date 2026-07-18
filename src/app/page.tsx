import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  getFeaturedWorkProjects,
  getHomePage,
  getServices,
} from "@/sanity/fetchers";
import { HomeExperience } from "./HomeExperience";

export default async function Home() {
  const [homePage, projects, services] = await Promise.all([
    getHomePage(),
    getFeaturedWorkProjects(),
    getServices(),
  ]);

  return (
    <PageShell variant="home">
      <HomeExperience
        content={homePage}
        projects={projects.slice(0, 7)}
        services={services}
      />
    </PageShell>
  );
}
