import { notFound } from "next/navigation";
import { WorkDetailGallery } from "@/components/work/WorkDetailGallery/WorkDetailGallery";
import { WorkDetailModal } from "@/components/work/WorkDetailModal/WorkDetailModal";
import { getWorkProjects } from "@/sanity/fetchers";

type InterceptedWorkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Without this the modal is rendered on demand, so every card click refetches
// every project — and their whole galleries — from Sanity.
export async function generateStaticParams() {
  const projects = await getWorkProjects();

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function InterceptedWorkDetailPage({
  params,
}: InterceptedWorkDetailPageProps) {
  const { slug } = await params;
  const projects = await getWorkProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <WorkDetailModal project={project}>
      <WorkDetailGallery presentation="modal" project={project} />
    </WorkDetailModal>
  );
}
