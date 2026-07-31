import { normalizeWorkCategory } from "@/utils/formatWorkCategory";
import type { NavigationItem } from "@/types/navigation";
import type { Project, ProjectImage, WorkPlacement } from "@/types/project";
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

type SanitySiteSettings = {
  name?: string;
  instagramUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  footerStatement?: string;
  navigationItems?: NavigationItem[];
};

type SanityHomePage = {
  eyebrow?: string;
  titleWords?: string[];
  heroImage?: SanityImageValue;
  manifestoWords?: string[];
  manifestoImageOne?: SanityImageValue;
  manifestoImageTwo?: SanityImageValue;
  selectedWorkEyebrow?: string;
  servicesEyebrow?: string;
};

type SanityAboutPage = {
  titleWords?: string[];
  portraitOne?: SanityImageValue;
  story?: string[];
};

type SanityWorkPage = {
  titleWords?: string[];
};

type SanityContactPage = {
  titleWords?: string[];
  formCopy?: string;
};

type SanityServicePage = {
  titleWords?: string[];
};

type SanityService = {
  _id?: string;
  id?: string;
  index?: string;
  title?: string;
  description?: string;
  features?: string[];
  price?: number;
  image?: SanityImageValue;
  ctaHref?: string;
};

type SanityProject = {
  _id?: string;
  slug?: { current?: string } | string;
  title?: string;
  meta?: string;
  category?: string;
  year?: string;
  location?: string;
  description?: string;
  cardImage?: SanityImageValue;
  featured?: boolean;
  featuredOrder?: number;
  homepageSpan?: string;
  workSpan?: string;
  images?: Array<SanityImageValue & {
    image?: SanityImageValue;
  }>;
};

async function fetchSanity<T>(query: string, label: string): Promise<T> {
  if (!isSanityConfigured) {
    throw new Error(
      `Sanity is required to load ${label}. Configure NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.`,
    );
  }

  try {
    return await sanityClient.fetch<T>(query);
  } catch (error) {
    throw new Error(`Unable to load ${label} from Sanity.`, { cause: error });
  }
}

function requireValue<T>(
  value: T | null | undefined,
  field: string,
): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`Sanity field "${field}" is required.`);
  }

  return value;
}

function requireString(value: string | null | undefined, field: string) {
  const resolved = requireValue(value, field).trim();

  if (!resolved) {
    throw new Error(`Sanity field "${field}" cannot be empty.`);
  }

  return resolved;
}

function requireStringArray(
  value: string[] | null | undefined,
  field: string,
) {
  const resolved = requireValue(value, field);

  if (!resolved.length || resolved.some((item) => !item.trim())) {
    throw new Error(`Sanity field "${field}" must contain non-empty values.`);
  }

  return resolved;
}

function requireDocument<T>(value: T | null, label: string): T {
  if (!value) {
    throw new Error(`Sanity document "${label}" is required.`);
  }

  return value;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = requireDocument(
    await fetchSanity<SanitySiteSettings | null>(
      siteSettingsQuery,
      "site settings",
    ),
    "siteSettings",
  );
  const instagramUrl = requireString(
    settings.instagramUrl,
    "siteSettings.instagramUrl",
  );
  const navigationItems = requireValue(
    settings.navigationItems,
    "siteSettings.navigationItems",
  );

  if (!navigationItems.length) {
    throw new Error(
      'Sanity field "siteSettings.navigationItems" must contain at least one item.',
    );
  }

  return {
    name: requireString(settings.name, "siteSettings.name"),
    instagramUrl,
    email: requireString(settings.email, "siteSettings.email"),
    phone: requireString(settings.phone, "siteSettings.phone"),
    location: requireString(settings.location, "siteSettings.location"),
    footerStatement: requireString(
      settings.footerStatement,
      "siteSettings.footerStatement",
    ),
    navigationItems: navigationItems.map((item, index) => ({
      label: requireString(
        item.label,
        `siteSettings.navigationItems[${index}].label`,
      ),
      href: requireString(
        item.href,
        `siteSettings.navigationItems[${index}].href`,
      ),
    })),
  };
}

export async function getHomePage(): Promise<HomePageContent> {
  const page = requireDocument(
    await fetchSanity<SanityHomePage | null>(homePageQuery, "the home page"),
    "homePage",
  );
  const manifestoWords = requireStringArray(
    page.manifestoWords,
    "homePage.manifestoWords",
  );

  if (manifestoWords.length !== 3) {
    throw new Error(
      'Sanity field "homePage.manifestoWords" must contain exactly three items.',
    );
  }

  return {
    eyebrow: requireString(page.eyebrow, "homePage.eyebrow"),
    titleWords: requireStringArray(page.titleWords, "homePage.titleWords"),
    heroImage: resolveSanityImage(page.heroImage, "homePage.heroImage"),
    manifestoWords: [
      manifestoWords[0],
      manifestoWords[1],
      manifestoWords[2],
    ],
    manifestoImageOne: resolveSanityImage(
      page.manifestoImageOne,
      "homePage.manifestoImageOne",
    ),
    manifestoImageTwo: resolveSanityImage(
      page.manifestoImageTwo,
      "homePage.manifestoImageTwo",
    ),
    selectedWorkEyebrow: requireString(
      page.selectedWorkEyebrow,
      "homePage.selectedWorkEyebrow",
    ),
    servicesEyebrow: requireString(
      page.servicesEyebrow,
      "homePage.servicesEyebrow",
    ),
  };
}

export async function getAboutPage(): Promise<AboutPageContent> {
  const page = requireDocument(
    await fetchSanity<SanityAboutPage | null>(aboutPageQuery, "the about page"),
    "aboutPage",
  );

  return {
    titleWords: requireStringArray(page.titleWords, "aboutPage.titleWords"),
    portraitOne: resolveSanityImage(
      page.portraitOne,
      "aboutPage.portraitOne",
    ),
    story: requireStringArray(page.story, "aboutPage.story"),
  };
}

export async function getWorkPage(): Promise<WorkPageContent> {
  const page = requireDocument(
    await fetchSanity<SanityWorkPage | null>(workPageQuery, "the work page"),
    "workPage",
  );

  return {
    titleWords: requireStringArray(page.titleWords, "workPage.titleWords"),
  };
}

export async function getContactPage(): Promise<ContactPageContent> {
  const page = requireDocument(
    await fetchSanity<SanityContactPage | null>(
      contactPageQuery,
      "the contact page",
    ),
    "contactPage",
  );

  return {
    titleWords: requireStringArray(page.titleWords, "contactPage.titleWords"),
    formCopy: requireString(page.formCopy, "contactPage.formCopy"),
  };
}

export async function getServicePage(): Promise<ServicePageContent> {
  const page = requireDocument(
    await fetchSanity<SanityServicePage | null>(
      servicePageQuery,
      "the service page",
    ),
    "servicePage",
  );

  return {
    titleWords: requireStringArray(page.titleWords, "servicePage.titleWords"),
  };
}

export async function getServices(): Promise<ServicePackage[]> {
  const services = await fetchSanity<SanityService[]>(
    servicesQuery,
    "service packages",
  );

  return services.map((service, index) => {
    const id = requireString(
      service.id ?? service._id,
      `servicePackage[${index}].id`,
    );
    const image = resolveSanityImage(
      service.image,
      `servicePackage[${index}].image`,
    );

    return {
      id,
      index: requireString(
        service.index,
        `servicePackage[${index}].index`,
      ),
      title: requireString(
        service.title,
        `servicePackage[${index}].title`,
      ),
      description: requireString(
        service.description,
        `servicePackage[${index}].description`,
      ),
      features: requireStringArray(
        service.features,
        `servicePackage[${index}].features`,
      ),
      price: requireValue(
        service.price,
        `servicePackage[${index}].price`,
      ),
      image: image.src,
      imageBlurDataURL: image.blurDataURL,
      imageAlt: image.alt,
      ctaHref: requireString(
        service.ctaHref,
        `servicePackage[${index}].ctaHref`,
      ),
    };
  });
}

export async function getWorkProjects(): Promise<Project[]> {
  const projects = await fetchSanity<SanityProject[]>(
    projectsQuery,
    "work projects",
  );

  return projects.map(mapSanityProject);
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

function mapSanityProject(project: SanityProject, index: number): Project {
  const fieldPrefix = `workProject[${index}]`;
  const slug = requireString(getSlug(project.slug), `${fieldPrefix}.slug`);
  const cardImage = resolveSanityImage(
    project.cardImage,
    `${fieldPrefix}.cardImage`,
  );
  const images: ProjectImage[] = (project.images ?? []).map(
    (item, imageIndex) =>
      resolveSanityImage(
        item.image ?? item,
        `${fieldPrefix}.images[${imageIndex}]`,
      ),
  );
  const featured = project.featured === true;

  return {
    id: requireString(project._id, `${fieldPrefix}._id`),
    slug,
    title: requireString(project.title, `${fieldPrefix}.title`),
    meta: requireString(project.meta, `${fieldPrefix}.meta`),
    category: normalizeWorkCategory(
      requireString(project.category, `${fieldPrefix}.category`),
    ),
    year: requireString(project.year, `${fieldPrefix}.year`),
    location: requireString(project.location, `${fieldPrefix}.location`),
    description: requireString(
      project.description,
      `${fieldPrefix}.description`,
    ),
    image: cardImage.src,
    imageBlurDataURL: cardImage.blurDataURL,
    alt: cardImage.alt,
    width: cardImage.width,
    height: cardImage.height,
    featured,
    placement: {
      featuredOrder: project.featuredOrder,
      homepageSpan: parseSpan(project.homepageSpan),
      workSpan: parseSpan(project.workSpan) as WorkPlacement["workSpan"],
    },
    images,
  };
}
