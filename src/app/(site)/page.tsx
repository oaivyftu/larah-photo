import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  getFeaturedWorkProjects,
  getHomePage,
  getServices,
  getSiteSettings,
  getWorkProjects,
} from "@/sanity/fetchers";
import { HomeExperience } from "./HomeExperience";

export default async function Home() {
  const [homePage, settings, projects, allProjects, services] =
    await Promise.all([
      getHomePage(),
      getSiteSettings(),
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
        siteName={settings.name}
      />
    </PageShell>
  );
}
