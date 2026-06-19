import type { Project, ProjectImage } from "@/types/project";
import { WorkProjectGalleryClient } from "./WorkProjectGalleryClient";

type WorkProjectGalleryProps = {
  closeHref?: string;
  isModal?: boolean;
  project: Project;
  showFullStoryLink?: boolean;
};

export function getProjectGalleryImages(project: Project): ProjectImage[] {
  return [project.heroImage, ...project.images];
}

export function WorkProjectGallery({
  closeHref,
  isModal = false,
  project,
  showFullStoryLink = false,
}: WorkProjectGalleryProps) {
  return (
    <WorkProjectGalleryClient
      closeHref={closeHref}
      images={getProjectGalleryImages(project)}
      isModal={isModal}
      project={project}
      showFullStoryLink={showFullStoryLink}
    />
  );
}
