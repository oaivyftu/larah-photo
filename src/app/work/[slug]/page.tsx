import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { WorkDetailGallery } from "@/components/work/WorkDetailGallery/WorkDetailGallery";
import { getWorkProjects } from "@/sanity/fetchers";

type WorkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const projects = await getWorkProjects();

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function WorkDetailPage({
  params,
}: WorkDetailPageProps) {
  const { slug } = await params;
  const projects = await getWorkProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <PageShell variant="project">
      <WorkDetailGallery project={project} />
    </PageShell>
  );
}
