export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  layout?: "full" | "half";
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
  client: string;
  service: string;
  description: string;
  image: string;
  alt: string;
  imageAlt: string;
  width: number;
  height: number;
  featured?: boolean;
  placement?: WorkPlacement;
  coverImage: string;
  heroImage: ProjectImage;
  images: ProjectImage[];
};
