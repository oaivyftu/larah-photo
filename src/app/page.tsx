import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  getFeaturedWorkProjects,
  getHomePage,
  getServices,
  getSiteSettings,
} from "@/sanity/fetchers";
import { HomeExperience } from "./HomeExperience";

export default async function Home() {
  const [homePage, projects, services, settings] = await Promise.all([
    getHomePage(),
    getFeaturedWorkProjects(),
    getServices(),
    getSiteSettings(),
  ]);

  return (
    <PageShell variant="home">
      <HomeExperience
        content={homePage}
        projects={projects.slice(0, 6)}
        services={services}
        settings={settings}
      />
    </PageShell>
  );
}
