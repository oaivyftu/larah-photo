import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import {
  getSiteSettings,
  getWorkPage,
  getWorkProjects,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import {
  buildBreadcrumbSchema,
  buildWorkCollectionSchema,
} from "@/utils/structuredData";
import { WorkGalleryClient } from "./WorkGalleryClient";

export async function generateMetadata(): Promise<Metadata> {
  const [projects, settings] = await Promise.all([
    getWorkProjects(),
    getSiteSettings(),
  ]);
  const [leadProject] = projects;

  return pageMetadata({
    title: "Work",
    description:
      `Selected photography projects by Larah Photo in ${settings.location} ` +
      `— ${projects.length} galleries spanning portrait, wedding and ` +
      "editorial commissions.",
    path: "/work",
    images: leadProject
      ? [toOpenGraphImage({ src: leadProject.image, alt: leadProject.alt })]
      : undefined,
  });
}

export default async function WorkPage() {
  const [content, projects] = await Promise.all([
    getWorkPage(),
    getWorkProjects(),
  ]);

  return (
    <PageShell variant="work">
      <JsonLd data={buildWorkCollectionSchema(projects)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ])}
      />
      <WorkGalleryClient content={content} projects={projects} />
    </PageShell>
  );
}
