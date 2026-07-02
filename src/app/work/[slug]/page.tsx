import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { formatWorkCategory } from "@/data/work";
import { getWorkProject, getWorkProjects } from "@/sanity/fetchers";
import { ProjectExperience } from "./ProjectExperience";

type ProjectPageProps = {
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

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getWorkProject(slug);

  if (!project) {
    notFound();
  }

  const openGraphImage = project.images[0] ?? {
    src: project.image,
    alt: project.alt,
    width: project.width,
    height: project.height,
  };

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
          url: openGraphImage.src,
          width: openGraphImage.width,
          height: openGraphImage.height,
          alt: openGraphImage.alt,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getWorkProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <PageShell variant="project">
      <ProjectExperience project={project} />
    </PageShell>
  );
}
