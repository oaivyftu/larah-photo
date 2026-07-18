export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type WorkPlacement = {
  featured?: boolean;
  featuredOrder?: number;
  homepageSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "full";
  workSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  category: string;
  tags: string[];
  year: string;
  location: string;
  clientSubject: string;
  serviceCategory: string;
  description: string;
  image: string;
  alt: string;
  imageAlt: string;
  width: number;
  height: number;
  featured?: boolean;
  placement?: WorkPlacement;
  coverImage: string;
  images: ProjectImage[];
};
