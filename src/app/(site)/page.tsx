import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, siteDescription } from "@/constants/seo";
import {
  getFeaturedWorkProjects,
  getHomePage,
  getServices,
  getSiteSettings,
  getWorkProjects,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import { buildWebSiteSchema } from "@/utils/structuredData";
import { HomeExperience } from "./HomeExperience";

export async function generateMetadata(): Promise<Metadata> {
  const [homePage, settings] = await Promise.all([
    getHomePage(),
    getSiteSettings(),
  ]);

  return pageMetadata({
    // The one title not run through the `%s | Larah Photo` template — the
    // brand is already the subject here, and appending it reads as a stutter.
    // The trade names the city because this is the title a local search
    // matches against; the tagline stays where a reader sees it, in the hero.
    title: `${settings.name} — Photographer in ${settings.location}`,
    absoluteTitle: true,
    description: siteDescription,
    path: "/",
    images: [toOpenGraphImage(homePage.heroImage)],
  });
}

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
      <JsonLd data={buildWebSiteSchema()} />
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
