export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  layout?: "full" | "half";
};

export type Project = {
  slug: string;
  title: string;
  meta: string;
  category: string;
  year: string;
  location: string;
  client: string;
  service: string;
  description: string;
  image: string;
  imageAlt: string;
  width: number;
  height: number;
  coverImage: string;
  heroImage: ProjectImage;
  images: ProjectImage[];
};
