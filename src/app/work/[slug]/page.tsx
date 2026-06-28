import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  formatWorkCategory,
  getWorkProject,
  workProjects,
} from "@/data/work";
import { ProjectExperience } from "./ProjectExperience";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return workProjects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    notFound();
  }

  return {
    title: `${project.title} | Work | Larah Photo`,
    description:
      project.description ||
      `${formatWorkCategory(project.category)} photography in ${project.location}.`,
    openGraph: {
      title: `${project.title} | Larah Photo`,
      description: project.description,
      images: [
        {
          url: project.heroImage.src,
          width: project.heroImage.width,
          height: project.heroImage.height,
          alt: project.heroImage.alt,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <PageShell variant="project">
      <ProjectExperience project={project} />
    </PageShell>
  );
}
