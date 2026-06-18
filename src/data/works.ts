import type { Project } from "@/types/project";

const blueSkyPortrait = {
  src: "/images/figma/source/blue-sky-portrait.png",
  alt: "Two women seated in a green field below blue and white clouds",
  width: 1365,
  height: 2048,
};

const fieldWide = {
  src: "/images/figma/source/field-wide.png",
  alt: "Two people standing apart in a wide green field",
  width: 2048,
  height: 1366,
};

const forestSession = {
  src: "/images/figma/source/forest-session.png",
  alt: "Woman in an orange dress seated in a forest",
  width: 2048,
  height: 1366,
};

const aboutPortrait = {
  src: "/images/about/larah-about.jpg",
  alt: "Portrait session in warm natural light",
  width: 990,
  height: 562,
};

const rossParkPortrait = {
  src: "/images/work/ross-park/ross-park-model-01.webp",
  alt: "Editorial portrait in a park setting",
  width: 4160,
  height: 6240,
};

const displayImages = [
  blueSkyPortrait,
  fieldWide,
  forestSession,
  aboutPortrait,
  rossParkPortrait,
];

const featuredPlacements: Record<
  string,
  NonNullable<Project["placement"]> & { featured: true }
> = {
  "forest-01": { featured: true, featuredOrder: 1, homepageSpan: 8, workSpan: 3 },
  "blue-sky-01": { featured: true, featuredOrder: 2, homepageSpan: 4, workSpan: 3 },
  "blue-sky-02": { featured: true, featuredOrder: 3, homepageSpan: 5, workSpan: 3 },
  "forest-02": { featured: true, featuredOrder: 4, homepageSpan: 7, workSpan: 3 },
  "blue-sky-03": { featured: true, featuredOrder: 5, homepageSpan: 7, workSpan: 3 },
  "field-01": { featured: true, featuredOrder: 6, homepageSpan: 5, workSpan: 3 },
  "field-02": { featured: true, featuredOrder: 7, homepageSpan: 12, workSpan: 3 },
};

const categoryDetails: Record<
  string,
  Pick<Project, "location" | "service" | "description">
> = {
  couples: {
    location: "London, Ontario",
    service: "Couples Photography",
    description:
      "A quiet outdoor session shaped around soft movement, open air, and the natural connection between two people.",
  },
  portraits: {
    location: "London, Ontario",
    service: "Portrait Photography",
    description:
      "A personal portrait story with gentle direction, warm textures, and space for the subject to feel present on camera.",
  },
  graduation: {
    location: "Western University",
    service: "Graduation Photography",
    description:
      "A celebratory graduation session balancing classic campus portraits with relaxed editorial frames.",
  },
  editorial: {
    location: "London, Ontario",
    service: "Editorial Photography",
    description:
      "An editorial-inspired study in landscape, styling, and calm portraiture for a romantic visual story.",
  },
};

function makeProject(
  project: Omit<
    Project,
    | "location"
    | "service"
    | "description"
    | "id"
    | "tags"
    | "alt"
    | "imageAlt"
    | "featured"
    | "placement"
    | "coverImage"
    | "heroImage"
    | "images"
  > & {
    id?: string;
    tags?: string[];
    imageAlt?: string;
    alt?: string;
    featured?: boolean;
    placement?: Project["placement"];
    gallery: Project["images"];
  },
): Project {
  const detail = categoryDetails[project.category];
  const [heroImage, ...supportingImages] = project.gallery;
  const displayImage =
    displayImages.find((image) => image.src === project.image) ?? heroImage;
  const placement = {
    ...featuredPlacements[project.slug],
    ...project.placement,
  };
  const featured = project.featured ?? placement.featured ?? false;
  const alt = project.alt ?? project.imageAlt ?? displayImage.alt;

  return {
    ...project,
    id: project.id ?? project.slug,
    tags: project.tags ?? [project.category],
    location: detail.location,
    service: detail.service,
    description: detail.description,
    alt,
    imageAlt: alt,
    width: displayImage.width,
    height: displayImage.height,
    featured,
    placement,
    coverImage: displayImage.src,
    heroImage,
    images: supportingImages,
  };
}

// Placeholder client/location/description details are intentionally centralized
// here so future real project entries can be edited in one place.
export const workProjects: Project[] = [
  makeProject({
    slug: "blue-sky-01",
    title: "Blue Sky Session",
    meta: "Couples 2024",
    category: "couples",
    year: "2024",
    client: "Couple Session",
    image: "/images/figma/source/blue-sky-portrait.png",
    width: 260,
    height: 392,
    gallery: [
      { ...blueSkyPortrait, layout: "full" },
      { ...fieldWide, layout: "half" },
      { ...forestSession, layout: "half" },
      { ...aboutPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "forest-01",
    title: "Forest Portraits",
    meta: "Portraits 2024",
    category: "portraits",
    year: "2024",
    client: "Portrait Subject",
    image: "/images/figma/source/forest-session.png",
    width: 260,
    height: 174,
    gallery: [
      { ...forestSession, layout: "full" },
      { ...rossParkPortrait, layout: "half" },
      { ...blueSkyPortrait, layout: "half" },
      { ...fieldWide, layout: "full" },
    ],
  }),
  makeProject({
    slug: "blue-sky-02",
    title: "Open Field",
    meta: "Graduation 2024",
    category: "graduation",
    year: "2024",
    client: "Graduate Session",
    image: "/images/figma/source/blue-sky-portrait.png",
    width: 260,
    height: 392,
    gallery: [
      { ...blueSkyPortrait, layout: "full" },
      { ...fieldWide, layout: "half" },
      { ...forestSession, layout: "half" },
      { ...rossParkPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "field-01",
    title: "Field Notes",
    meta: "Editorial 2024",
    category: "editorial",
    year: "2024",
    client: "Editorial Subject",
    image: "/images/figma/source/field-wide.png",
    width: 260,
    height: 147,
    gallery: [
      { ...fieldWide, layout: "full" },
      { ...blueSkyPortrait, layout: "half" },
      { ...forestSession, layout: "half" },
      { ...aboutPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "field-02",
    title: "Quiet Distance",
    meta: "Couples 2024",
    category: "couples",
    year: "2024",
    client: "Couple Session",
    image: "/images/figma/source/field-wide.png",
    width: 260,
    height: 147,
    gallery: [
      { ...fieldWide, layout: "full" },
      { ...blueSkyPortrait, layout: "half" },
      { ...aboutPortrait, layout: "half" },
      { ...forestSession, layout: "full" },
    ],
  }),
  makeProject({
    slug: "forest-02",
    title: "Golden Hour",
    meta: "Portraits 2024",
    category: "portraits",
    year: "2024",
    client: "Portrait Subject",
    image: "/images/figma/source/forest-session.png",
    width: 260,
    height: 174,
    gallery: [
      { ...forestSession, layout: "full" },
      { ...aboutPortrait, layout: "half" },
      { ...rossParkPortrait, layout: "half" },
      { ...fieldWide, layout: "full" },
    ],
  }),
  makeProject({
    slug: "blue-sky-03",
    title: "Campus Light",
    meta: "Graduation 2024",
    category: "graduation",
    year: "2024",
    client: "Graduate Session",
    image: "/images/figma/source/blue-sky-portrait.png",
    width: 260,
    height: 392,
    gallery: [
      { ...blueSkyPortrait, layout: "full" },
      { ...rossParkPortrait, layout: "half" },
      { ...fieldWide, layout: "half" },
      { ...forestSession, layout: "full" },
    ],
  }),
  makeProject({
    slug: "field-03",
    title: "Meadow Study",
    meta: "Editorial 2024",
    category: "editorial",
    year: "2024",
    client: "Editorial Subject",
    image: "/images/figma/source/field-wide.png",
    width: 260,
    height: 147,
    gallery: [
      { ...fieldWide, layout: "full" },
      { ...forestSession, layout: "half" },
      { ...blueSkyPortrait, layout: "half" },
      { ...rossParkPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "forest-03",
    title: "Woodland Frame",
    meta: "Portraits 2024",
    category: "portraits",
    year: "2024",
    client: "Portrait Subject",
    image: "/images/figma/source/forest-session.png",
    width: 260,
    height: 174,
    gallery: [
      { ...forestSession, layout: "full" },
      { ...fieldWide, layout: "half" },
      { ...aboutPortrait, layout: "half" },
      { ...blueSkyPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "blue-sky-04",
    title: "Soft Horizon",
    meta: "Couples 2024",
    category: "couples",
    year: "2024",
    client: "Couple Session",
    image: "/images/figma/source/blue-sky-portrait.png",
    width: 260,
    height: 392,
    gallery: [
      { ...blueSkyPortrait, layout: "full" },
      { ...forestSession, layout: "half" },
      { ...fieldWide, layout: "half" },
      { ...aboutPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "forest-04",
    title: "Canopy",
    meta: "Editorial 2024",
    category: "editorial",
    year: "2024",
    client: "Editorial Subject",
    image: "/images/figma/source/forest-session.png",
    width: 260,
    height: 174,
    gallery: [
      { ...forestSession, layout: "full" },
      { ...rossParkPortrait, layout: "half" },
      { ...fieldWide, layout: "half" },
      { ...blueSkyPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "field-04",
    title: "Green Field",
    meta: "Graduation 2024",
    category: "graduation",
    year: "2024",
    client: "Graduate Session",
    image: "/images/figma/source/field-wide.png",
    width: 260,
    height: 147,
    gallery: [
      { ...fieldWide, layout: "full" },
      { ...blueSkyPortrait, layout: "half" },
      { ...forestSession, layout: "half" },
      { ...rossParkPortrait, layout: "full" },
    ],
  }),
  makeProject({
    slug: "blue-sky-05",
    title: "After Ceremony",
    meta: "Graduation 2024",
    category: "graduation",
    year: "2024",
    client: "Graduate Session",
    image: "/images/figma/source/blue-sky-portrait.png",
    width: 260,
    height: 392,
    gallery: [
      { ...blueSkyPortrait, layout: "full" },
      { ...fieldWide, layout: "half" },
      { ...aboutPortrait, layout: "half" },
      { ...forestSession, layout: "full" },
    ],
  }),
  makeProject({
    slug: "field-05",
    title: "Together Outside",
    meta: "Couples 2024",
    category: "couples",
    year: "2024",
    client: "Couple Session",
    image: "/images/figma/source/field-wide.png",
    width: 260,
    height: 147,
    gallery: [
      { ...fieldWide, layout: "full" },
      { ...forestSession, layout: "half" },
      { ...blueSkyPortrait, layout: "half" },
      { ...rossParkPortrait, layout: "full" },
    ],
  }),
];

export function formatWorkCategory(category: string) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const featuredWorkProjects = workProjects
  .filter((project) => project.featured)
  .sort(
    (projectA, projectB) =>
      (projectA.placement?.featuredOrder ?? 0) -
      (projectB.placement?.featuredOrder ?? 0),
  );

export const workCategories = Array.from(
  new Set(workProjects.map((project) => project.category)),
);

export function getWorkProject(slug: string) {
  return workProjects.find((project) => project.slug === slug);
}

export function getAdjacentWorkProjects(slug: string) {
  const currentIndex = workProjects.findIndex((project) => project.slug === slug);

  if (currentIndex === -1) {
    return { previousProject: undefined, nextProject: undefined };
  }

  return {
    previousProject:
      workProjects[(currentIndex - 1 + workProjects.length) % workProjects.length],
    nextProject: workProjects[(currentIndex + 1) % workProjects.length],
  };
}
