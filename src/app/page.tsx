import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  getFeaturedWorkProjects,
  getHomePage,
  getServices,
  getWorkProjects,
} from "@/sanity/fetchers";
import { HomeExperience } from "./HomeExperience";

export default async function Home() {
  const [homePage, projects, allProjects, services] = await Promise.all([
    getHomePage(),
    getFeaturedWorkProjects(),
    getWorkProjects(),
    getServices(),
  ]);

  return (
    <PageShell variant="home">
      <HomeExperience
        content={homePage}
        projectCount={allProjects.length}
        projects={projects.slice(0, 7)}
        services={services}
      />
    </PageShell>
  );
}
