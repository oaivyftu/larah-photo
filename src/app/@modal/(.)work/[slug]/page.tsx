import { notFound } from "next/navigation";
import { WorkProjectGallery } from "@/components/work/WorkProjectGallery/WorkProjectGallery";
import { getWorkProject } from "@/data/work";

type ProjectModalPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProjectModalPage({ params }: ProjectModalPageProps) {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    notFound();
  }

  return <WorkProjectGallery isModal project={project} />;
}
