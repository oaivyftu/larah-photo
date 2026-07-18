import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getWorkProjects } from "@/sanity/fetchers";
import { WorkGalleryClient } from "./WorkGalleryClient";

export default async function WorkPage() {
  const projects = await getWorkProjects();

  return (
    <PageShell variant="work">
      <WorkGalleryClient projects={projects} />
    </PageShell>
  );
}
