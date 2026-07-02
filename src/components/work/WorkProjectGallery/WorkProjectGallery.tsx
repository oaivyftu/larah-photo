import type { Project, ProjectImage } from "@/types/project";
import { WorkProjectGalleryClient } from "./WorkProjectGalleryClient";

type WorkProjectGalleryProps = {
  isModal?: boolean;
  onClose?: () => void;
  project: Project;
};

export function getProjectGalleryImages(project: Project): ProjectImage[] {
  if (project.images.length) {
    return project.images;
  }

  return [
    {
      src: project.image,
      alt: project.alt,
      width: project.width,
      height: project.height,
    },
  ];
}

export function WorkProjectGallery({
  isModal = false,
  onClose,
  project,
}: WorkProjectGalleryProps) {
  return (
    <WorkProjectGalleryClient
      images={getProjectGalleryImages(project)}
      isModal={isModal}
      onClose={onClose}
      project={project}
    />
  );
}
