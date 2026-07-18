import {
  fallbackAboutPage,
  fallbackContactPage,
  fallbackHomePage,
  fallbackServicePage,
  fallbackWorkPage,
} from "@/data/pages";
import { services as fallbackServices } from "@/data/services";
import { fallbackSiteSettings } from "@/data/site";
import { workProjects as fallbackProjects } from "@/data/work";
import type { Project, WorkPlacement } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  ServicePageContent,
  SiteSettings,
  WorkPageContent,
} from "@/types/site";
import { sanityClient } from "./client";
import { isSanityConfigured } from "./env";
import { resolveSanityImage, type SanityImageValue } from "./image";
import {
  aboutPageQuery,
  contactPageQuery,
  homePageQuery,
  projectsQuery,
  servicePageQuery,
  servicesQuery,
  siteSettingsQuery,
  workPageQuery,
} from "./queries";

type SanitySiteSettings = Partial<
  Pick<
    SiteSettings,
    "name" | "instagramUrl" | "email" | "phone" | "location" | "footerStatement"
  >
>;

type SanityPageImage = SanityImageValue | null;

type SanityHomePage = Partial<
  Omit<HomePageContent, "manifestoWords" | "manifestoImageOne" | "manifestoImageTwo" | "heroImage">
> & {
  titleWords?: string[];
  manifestoWords?: string[];
  heroImage?: SanityPageImage;
  manifestoImageOne?: SanityPageImage;
  manifestoImageTwo?: SanityPageImage;
};

type SanityAboutPage = Partial<
  Omit<AboutPageContent, "portraitOne" | "portraitTwo">
> & {
  portraitOne?: SanityPageImage;
  portraitTwo?: SanityPageImage;
};

type SanityWorkPage = Partial<WorkPageContent>;

type SanityContactPage = Partial<Omit<ContactPageContent, "image">> & {
  image?: SanityPageImage;
};

type SanityServicePage = Partial<Omit<ServicePageContent, "image">> & {
  image?: SanityPageImage;
};

type SanityService = {
  _id?: string;
  id?: string;
  index?: string;
  title?: string;
  description?: string;
  features?: string[];
  price?: number;
  image?: SanityPageImage;
  ctaHref?: string;
};

type SanityProject = {
  _id?: string;
  slug?: { current?: string } | string;
  title?: string;
  meta?: string;
  category?: string;
  tags?: string[];
  year?: string;
  location?: string;
  clientSubject?: string;
  serviceCategory?: string;
  description?: string;
  cardImage?: SanityPageImage;
  featured?: boolean;
  featuredOrder?: number;
  homepageSpan?: string;
  workSpan?: string;
  images?: Array<{
    image?: SanityPageImage;
  }>;
};

async function fetchSanity<T>(query: string): Promise<T | null> {
  if (!isSanityConfigured) {
    return null;
  }

  try {
    return await sanityClient.fetch<T>(query);
  } catch (error) {
    console.warn("Sanity fetch failed; using local fallback.", error);
    return null;
  }
}

function getInstagramDisplayUrl(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function getInstagramHandle(displayUrl: string) {
  return `@${
    displayUrl
      .replace(/^www\./, "")
      .replace(/^instagram\.com\//, "")
      .replace(/\/$/, "") || "larahphoto"
  }`;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await fetchSanity<SanitySiteSettings>(siteSettingsQuery);
  const instagramUrl = settings?.instagramUrl ?? fallbackSiteSettings.instagramUrl;
  const instagramDisplayUrl = getInstagramDisplayUrl(instagramUrl);

  return {
    ...fallbackSiteSettings,
    ...settings,
    instagramUrl,
    instagramDisplayUrl,
    instagramHandle: getInstagramHandle(instagramDisplayUrl),
  };
}

export async function getHomePage(): Promise<HomePageContent> {
  const page = await fetchSanity<SanityHomePage>(homePageQuery);

  return {
    ...fallbackHomePage,
    ...page,
    titleWords: page?.titleWords?.length ? page.titleWords : fallbackHomePage.titleWords,
    manifestoWords:
      page?.manifestoWords?.length === 3
        ? [page.manifestoWords[0], page.manifestoWords[1], page.manifestoWords[2]]
        : fallbackHomePage.manifestoWords,
    heroImage: page?.heroImage
      ? resolveSanityImage(page.heroImage, fallbackHomePage.manifestoImageOne)
      : undefined,
    manifestoImageOne: resolveSanityImage(
      page?.manifestoImageOne,
      fallbackHomePage.manifestoImageOne,
    ),
    manifestoImageTwo: resolveSanityImage(
      page?.manifestoImageTwo,
      fallbackHomePage.manifestoImageTwo,
    ),
  };
}

export async function getAboutPage(): Promise<AboutPageContent> {
  const page = await fetchSanity<SanityAboutPage>(aboutPageQuery);

  return {
    ...fallbackAboutPage,
    ...page,
    titleWords: page?.titleWords?.length ? page.titleWords : fallbackAboutPage.titleWords,
    notes: page?.notes?.length ? page.notes : fallbackAboutPage.notes,
    story: page?.story?.length ? page.story : fallbackAboutPage.story,
    portraitOne: resolveSanityImage(page?.portraitOne, fallbackAboutPage.portraitOne),
    portraitTwo: resolveSanityImage(page?.portraitTwo, fallbackAboutPage.portraitTwo),
  };
}

export async function getWorkPage(): Promise<WorkPageContent> {
  const page = await fetchSanity<SanityWorkPage>(workPageQuery);

  return {
    ...fallbackWorkPage,
    ...page,
    titleWords: page?.titleWords?.length ? page.titleWords : fallbackWorkPage.titleWords,
  };
}

export async function getContactPage(): Promise<ContactPageContent> {
  const page = await fetchSanity<SanityContactPage>(contactPageQuery);

  return {
    ...fallbackContactPage,
    ...page,
    titleWords: page?.titleWords?.length
      ? page.titleWords
      : fallbackContactPage.titleWords,
    image: resolveSanityImage(page?.image, fallbackContactPage.image),
  };
}

export async function getServicePage(): Promise<ServicePageContent> {
  const page = await fetchSanity<SanityServicePage>(servicePageQuery);

  return {
    ...fallbackServicePage,
    ...page,
    titleWords: page?.titleWords?.length
      ? page.titleWords
      : fallbackServicePage.titleWords,
    image: resolveSanityImage(page?.image, fallbackServicePage.image),
  };
}

export async function getServices(): Promise<ServicePackage[]> {
  const services = await fetchSanity<SanityService[]>(servicesQuery);

  if (!services?.length) {
    return fallbackServices;
  }

  return services.map((service, index) => {
    const fallback = fallbackServices[index] ?? fallbackServices[0];
    const image = resolveSanityImage(service.image, {
      src: fallback.image,
      alt: fallback.imageAlt,
      width: 2048,
      height: 1366,
    });

    return {
      id: service.id ?? service._id ?? fallback.id,
      index: service.index ?? fallback.index,
      title: service.title ?? fallback.title,
      description: service.description ?? fallback.description,
      features: service.features?.length ? service.features : fallback.features,
      price: service.price ?? fallback.price,
      image: image.src,
      imageAlt: image.alt,
      ctaHref: service.ctaHref ?? fallback.ctaHref,
    };
  });
}

export async function getWorkProjects(): Promise<Project[]> {
  const projects = await fetchSanity<SanityProject[]>(projectsQuery);

  if (!projects?.length) {
    return fallbackProjects;
  }

  return projects
    .map((project, index) => mapSanityProject(project, fallbackProjects[index] ?? fallbackProjects[0]))
    .filter(Boolean);
}

export async function getFeaturedWorkProjects(): Promise<Project[]> {
  const projects = await getWorkProjects();

  return projects
    .filter((project) => project.featured)
    .sort(
      (projectA, projectB) =>
        (projectA.placement?.featuredOrder ?? 0) -
        (projectB.placement?.featuredOrder ?? 0),
    );
}

function getSlug(slug?: SanityProject["slug"]) {
  return typeof slug === "string" ? slug : slug?.current;
}

function parseSpan(value: string | undefined): WorkPlacement["homepageSpan"] {
  if (!value) {
    return undefined;
  }

  if (value === "full") {
    return "full";
  }

  const numberValue = Number(value);

  return numberValue >= 1 && numberValue <= 12
    ? (numberValue as WorkPlacement["homepageSpan"])
    : undefined;
}

function mapSanityProject(project: SanityProject, fallback: Project): Project {
  const slug = getSlug(project.slug) ?? fallback.slug;
  const cardImage = resolveSanityImage(project.cardImage, {
    src: fallback.image,
    alt: fallback.alt,
    width: fallback.width,
    height: fallback.height,
  });
  const images =
    project.images?.length
      ? project.images.map((item, index) =>
          resolveSanityImage(item.image, fallback.images[index] ?? cardImage),
        )
      : fallback.images;
  const featured = project.featured ?? fallback.featured ?? false;

  return {
    ...fallback,
    id: project._id ?? slug,
    slug,
    title: project.title ?? fallback.title,
    meta: project.meta ?? fallback.meta,
    category: project.category ?? fallback.category,
    tags: project.tags?.length ? project.tags : fallback.tags,
    year: project.year ?? fallback.year,
    location: project.location ?? fallback.location,
    clientSubject: project.clientSubject ?? fallback.clientSubject,
    serviceCategory: project.serviceCategory ?? fallback.serviceCategory,
    description: project.description ?? fallback.description,
    image: cardImage.src,
    alt: cardImage.alt,
    imageAlt: cardImage.alt,
    width: cardImage.width,
    height: cardImage.height,
    featured,
    placement: {
      featured,
      featuredOrder: project.featuredOrder ?? fallback.placement?.featuredOrder,
      homepageSpan: parseSpan(project.homepageSpan) ?? fallback.placement?.homepageSpan,
      workSpan:
        (parseSpan(project.workSpan) as WorkPlacement["workSpan"] | undefined) ??
        fallback.placement?.workSpan,
    },
    coverImage: cardImage.src,
    images,
  };
}
