import { PageShell } from "@/components/layout/PageShell/PageShell";
import { workProjects } from "@/data/work";
import { WorkGalleryClient } from "./WorkGalleryClient";

export default function WorkPage() {
  return (
    <PageShell variant="work">
      <WorkGalleryClient projects={workProjects} />
    </PageShell>
  );
}
