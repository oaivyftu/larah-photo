import { cache } from "react";
import { normalizeWorkCategory } from "@/utils/formatWorkCategory";
import type { NavigationItem } from "@/types/navigation";
import type { Project, ProjectImage, WorkPlacement } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  PostalAddress,
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
  projectBySlugQuery,
  projectSlugsQuery,
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
  priceCurrency?: string;
  postalAddress?: PostalAddress;
  footerStatement?: string;
  navigationItems?: NavigationItem[];
};

type SanityHomePage = {
  heroTagline?: string;
  heroPortraitImage?: SanityImageValue;
  heroImage?: SanityImageValue;
  heroCtaLabel?: string;
  heroCtaHref?: string;
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
  images?: SanityImageValue[];
};

/** Shared by the fetchers and the `/api/revalidate` webhook that busts them. */
export const SANITY_CACHE_TAG = "sanity";

/** Upper bound on how stale a page can be if the webhook never fires. */
const SANITY_REVALIDATE_SECONDS = 3600;

/**
 * Memoised for the lifetime of a single render pass. Without it every route
 * pays for `getSiteSettings` twice — once in `PageShell`, once in the page —
 * and the home page runs `projectsQuery` twice over. `cache` compares
 * arguments with `Object.is`, so the params travel as a JSON string: a fresh
 * object literal per call would never hit.
 */
const fetchSanityCached = cache(
  async (query: string, paramsJson: string): Promise<unknown> =>
    sanityClient.fetch(query, JSON.parse(paramsJson), {
      // Without a cache directive Next treats the request as `no-store`, which
      // makes every route dynamic and re-queries Sanity on each crawl. These
      // pages change a few times a month, so they are prerendered and
      // refreshed hourly instead.
      //
      // One coarse tag rather than per-document ones: the site is small enough
      // that busting it wholesale is cheaper than tracking which page embeds
      // which document, and `siteSettings` alone appears on all of them.
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: [SANITY_CACHE_TAG] },
    }),
);

async function fetchSanity<T>(
  query: string,
  label: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!isSanityConfigured) {
    throw new Error(
      `Sanity is required to load ${label}. Configure NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.`,
    );
  }

  try {
    return (await fetchSanityCached(query, JSON.stringify(params))) as T;
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
    // Not `requireString`: the field is new, so existing documents have no
    // value and a hard failure would take the whole site down until an editor
    // opened the Studio. The studio is in Ontario, so CAD is the safe read of
    // the bare "$" the price UI renders.
    priceCurrency: settings.priceCurrency?.trim() || "CAD",
    postalAddress: settings.postalAddress,
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
    heroTagline: requireString(page.heroTagline, "homePage.heroTagline"),
    heroPortraitImage: resolveSanityImage(
      page.heroPortraitImage,
      "homePage.heroPortraitImage",
    ),
    heroImage: resolveSanityImage(page.heroImage, "homePage.heroImage"),
    heroCtaLabel: requireString(page.heroCtaLabel, "homePage.heroCtaLabel"),
    heroCtaHref: requireString(page.heroCtaHref, "homePage.heroCtaHref"),
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

  return projects.map((project, index) =>
    mapSanityProject(project, `workProject[${index}]`),
  );
}

/**
 * Returns `null` for an unknown slug so callers can decide: the page renders
 * `notFound()`, while `generateMetadata` needs to return early without
 * throwing.
 */
export async function getWorkProjectBySlug(
  slug: string,
): Promise<Project | null> {
  const project = await fetchSanity<SanityProject | null>(
    projectBySlugQuery,
    `the "${slug}" work project`,
    { slug },
  );

  return project ? mapSanityProject(project, `workProject("${slug}")`) : null;
}

/** Slugs alone, for `generateStaticParams` and the sitemap. */
export async function getWorkProjectSlugs(): Promise<string[]> {
  const slugs = await fetchSanity<(string | null)[]>(
    projectSlugsQuery,
    "work project slugs",
  );

  return slugs.filter((slug): slug is string => Boolean(slug?.trim()));
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

/** `fieldPrefix` only shapes validation error messages, so single-document
 *  callers can name the document instead of faking a list position. */
function mapSanityProject(
  project: SanityProject,
  fieldPrefix: string,
): Project {
  const slug = requireString(getSlug(project.slug), `${fieldPrefix}.slug`);
  const cardImage = resolveSanityImage(
    project.cardImage,
    `${fieldPrefix}.cardImage`,
  );
  const images: ProjectImage[] = (project.images ?? []).map(
    (item, imageIndex) =>
      resolveSanityImage(item, `${fieldPrefix}.images[${imageIndex}]`),
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
    },
    images,
  };
}
