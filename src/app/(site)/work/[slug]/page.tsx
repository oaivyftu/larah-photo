import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { WorkDetailGallery } from "@/components/work/WorkDetailGallery/WorkDetailGallery";
import { pageMetadata } from "@/constants/seo";
import { getWorkProjectBySlug, getWorkProjectSlugs } from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import {
  buildBreadcrumbSchema,
  buildProjectSchema,
} from "@/utils/structuredData";

type WorkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getWorkProjectBySlug(slug);

  if (!project) {
    // The page itself calls `notFound()`, but a crawler reading only the head
    // would otherwise file the 404 under a plausible-looking title.
    return { title: "Project not found", robots: { index: false } };
  }

  return pageMetadata({
    title: project.title,
    description: project.description,
    // Self-referencing canonical matters more here than anywhere else: the
    // intercepting modal route renders this same project at this same URL.
    path: `/work/${project.slug}`,
    images: [toOpenGraphImage({ src: project.image, alt: project.alt })],
  });
}

export async function generateStaticParams() {
  const slugs = await getWorkProjectSlugs();

  return slugs.map((slug) => ({ slug }));
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const project = await getWorkProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <PageShell variant="project">
      <JsonLd data={buildProjectSchema(project)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: project.title, path: `/work/${project.slug}` },
        ])}
      />
      <WorkDetailGallery project={project} />
    </PageShell>
  );
}
