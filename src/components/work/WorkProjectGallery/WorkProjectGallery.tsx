import type { Project, ProjectImage } from "@/types/project";
import { WorkProjectGalleryClient } from "./WorkProjectGalleryClient";

type WorkProjectGalleryProps = {
  isModal?: boolean;
  project: Project;
};

export function getProjectGalleryImages(project: Project): ProjectImage[] {
  return [project.heroImage, ...project.images];
}

export function WorkProjectGallery({
  isModal = false,
  project,
}: WorkProjectGalleryProps) {
  return (
    <WorkProjectGalleryClient
      images={getProjectGalleryImages(project)}
      isModal={isModal}
      project={project}
    />
  );
}
