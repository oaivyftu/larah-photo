import type { PortableTextBlock } from "next-sanity";
import { cache } from "react";
import { isJournalCategory } from "@/constants/journalCategories";
import {
  HEADING_PLACEHOLDERS,
  LANDING_CONFIRM_MARKER,
} from "@/constants/landingPage";
import { isIsoDate, todayInStudioTimeZone } from "@/utils/journalDate";
import { parseEmbedUrl } from "@/utils/journalEmbed";
import { composeLandingHeading } from "@/utils/landingHeading";
import { isLandingSlug } from "@/utils/landingSlug";
import { normalizeWorkCategory } from "@/utils/formatWorkCategory";
import type {
  JournalBodyBlock,
  JournalPageContent,
  JournalPost,
  JournalPostSummary,
} from "@/types/journal";
import type {
  LandingFaq,
  LandingPage,
  LandingPageLink,
  LandingPageSettings,
  LandingPageSummary,
  LandingSection,
} from "@/types/landing";
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
  journalPageQuery,
  journalPostBySlugQuery,
  journalPostSlugsQuery,
  journalPostsQuery,
  landingPageBySlugQuery,
  landingPageSlugsQuery,
  landingPagesQuery,
  landingSettingsQuery,
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
  googleBusinessUrl?: string;
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

type SanityJournalPage = {
  titleWords?: string[];
  emptyStateMessage?: string;
  ctaHeading?: string;
  ctaBody?: string;
  ctaContactLabel?: string;
  ctaWorkLabel?: string;
};

type SanityJournalBodyMember =
  | ({ _type: "block"; _key?: string } & Record<string, unknown>)
  | ({ _type: "bodyImage"; _key?: string; caption?: string } & SanityImageValue)
  | { _type: "embed"; _key?: string; url?: string; title?: string };

type SanityJournalPost = {
  _updatedAt?: string;
  slug?: { current?: string } | string;
  title?: string;
  excerpt?: string;
  publishedAt?: string;
  category?: string;
  location?: string;
  coverImage?: SanityImageValue;
  bodyImages?: SanityImageValue[];
  body?: SanityJournalBodyMember[];
  seoTitle?: string;
  seoDescription?: string;
};

type SanityLandingPage = {
  _updatedAt?: string;
  slug?: { current?: string } | string;
  serviceName?: string;
  alternateName?: string;
  category?: string;
  packageId?: string;
  packageImage?: SanityImageValue | null;
  introduction?: string[];
  sections?: { heading?: string; body?: string[] }[];
  faqs?: { question?: string; answer?: string }[];
  seoTitle?: string;
  seoDescription?: string;
  /** `null` when the reference dangles or points at an unpublished package. */
  package?: SanityService | null;
};

type SanityLandingSettings = {
  headingPattern?: string;
  projectsHeading?: string;
  packageHeading?: string;
  packageBookLabel?: string;
  faqHeading?: string;
  ctaHeading?: string;
  ctaBody?: string;
  ctaContactLabel?: string;
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

function requireStringArray(value: string[] | null | undefined, field: string) {
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
    // Not `requireString`: optional in the Studio, and existing documents
    // predate the field.
    googleBusinessUrl: settings.googleBusinessUrl,
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
    manifestoWords: [manifestoWords[0], manifestoWords[1], manifestoWords[2]],
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
    portraitOne: resolveSanityImage(page.portraitOne, "aboutPage.portraitOne"),
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

  return services.map((service, index) =>
    mapSanityService(service, `servicePackage[${index}]`),
  );
}

/**
 * The one mapper for a service package, so the services page and a landing
 * page's package block cannot disagree about what a valid package is.
 * `fieldPrefix` only shapes validation messages.
 */
function mapSanityService(
  service: SanityService,
  fieldPrefix: string,
): ServicePackage {
  const id = requireString(service.id ?? service._id, `${fieldPrefix}.id`);
  const image = resolveSanityImage(service.image, `${fieldPrefix}.image`);

  return {
    id,
    index: requireString(service.index, `${fieldPrefix}.index`),
    title: requireString(service.title, `${fieldPrefix}.title`),
    description: requireString(
      service.description,
      `${fieldPrefix}.description`,
    ),
    features: requireStringArray(service.features, `${fieldPrefix}.features`),
    price: requireValue(service.price, `${fieldPrefix}.price`),
    image: image.src,
    imageBlurDataURL: image.blurDataURL,
    imageAlt: image.alt,
    ctaHref: requireString(service.ctaHref, `${fieldPrefix}.ctaHref`),
  };
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

export async function getJournalPage(): Promise<JournalPageContent> {
  const page = requireDocument(
    await fetchSanity<SanityJournalPage | null>(
      journalPageQuery,
      "the journal page",
    ),
    "journalPage",
  );

  return {
    titleWords: requireStringArray(page.titleWords, "journalPage.titleWords"),
    emptyStateMessage: requireString(
      page.emptyStateMessage,
      "journalPage.emptyStateMessage",
    ),
    cta: {
      heading: requireString(page.ctaHeading, "journalPage.ctaHeading"),
      body: requireString(page.ctaBody, "journalPage.ctaBody"),
      contactLabel: requireString(
        page.ctaContactLabel,
        "journalPage.ctaContactLabel",
      ),
      workLabel: requireString(page.ctaWorkLabel, "journalPage.ctaWorkLabel"),
    },
  };
}

/**
 * Live posts only, newest first. Every journal read passes `today` — the
 * query's schedule predicate needs it, and passing it here rather than at
 * each call site is what keeps a scheduled post from ever being fetched.
 */
function journalParams(params: Record<string, unknown> = {}) {
  return { ...params, today: todayInStudioTimeZone() };
}

export async function getJournalPosts(): Promise<JournalPostSummary[]> {
  const posts = await fetchSanity<SanityJournalPost[]>(
    journalPostsQuery,
    "journal posts",
    journalParams(),
  );

  return posts.map((post, index) =>
    mapJournalSummary(post, `journalPost[${index}]`),
  );
}

/**
 * `null` for an unknown slug **and** for a scheduled one — the query cannot
 * tell them apart, and the page should not either (FR-012).
 */
export async function getJournalPostBySlug(
  slug: string,
): Promise<JournalPost | null> {
  const post = await fetchSanity<SanityJournalPost | null>(
    journalPostBySlugQuery,
    `the "${slug}" journal post`,
    journalParams({ slug }),
  );

  return post ? mapJournalPost(post, `journalPost("${slug}")`) : null;
}

export async function getJournalPostSlugs(): Promise<string[]> {
  const slugs = await fetchSanity<(string | null)[]>(
    journalPostSlugsQuery,
    "journal post slugs",
    journalParams(),
  );

  return slugs.filter((slug): slug is string => Boolean(slug?.trim()));
}

function requireJournalCategory(
  value: string | null | undefined,
  field: string,
) {
  const category = requireString(value, field);

  if (!isJournalCategory(category)) {
    throw new Error(
      `Sanity field "${field}" must be one of the journal categories, received "${category}".`,
    );
  }

  return category;
}

function requireIsoDate(value: string | null | undefined, field: string) {
  const date = requireString(value, field);

  if (!isIsoDate(date)) {
    throw new Error(`Sanity field "${field}" must be a YYYY-MM-DD date.`);
  }

  return date;
}

/** Blank overrides are unset, so the title/excerpt fallback applies. */
function optionalString(value: string | null | undefined) {
  return value?.trim() || undefined;
}

function mapJournalSummary(
  post: SanityJournalPost,
  fieldPrefix: string,
): JournalPostSummary {
  return {
    slug: requireString(getSlug(post.slug), `${fieldPrefix}.slug`),
    title: requireString(post.title, `${fieldPrefix}.title`),
    excerpt: requireString(post.excerpt, `${fieldPrefix}.excerpt`),
    publishedAt: requireIsoDate(post.publishedAt, `${fieldPrefix}.publishedAt`),
    category: requireJournalCategory(post.category, `${fieldPrefix}.category`),
    location: requireString(post.location, `${fieldPrefix}.location`),
    coverImage: resolveSanityImage(
      post.coverImage,
      `${fieldPrefix}.coverImage`,
    ),
    updatedAt: requireString(post._updatedAt, `${fieldPrefix}._updatedAt`),
    bodyImages: (post.bodyImages ?? []).map((image, imageIndex) =>
      resolveSanityImage(image, `${fieldPrefix}.bodyImages[${imageIndex}]`),
    ),
  };
}

function mapJournalPost(
  post: SanityJournalPost,
  fieldPrefix: string,
): JournalPost {
  const body = requireValue(post.body, `${fieldPrefix}.body`);

  if (!body.length) {
    throw new Error(
      `Sanity field "${fieldPrefix}.body" must contain at least one block.`,
    );
  }

  return {
    ...mapJournalSummary(post, fieldPrefix),
    body: body.map((member, index) =>
      mapJournalBodyMember(member, `${fieldPrefix}.body[${index}]`),
    ),
    seoTitle: optionalString(post.seoTitle),
    seoDescription: optionalString(post.seoDescription),
  };
}

function mapJournalBodyMember(
  member: SanityJournalBodyMember,
  field: string,
): JournalBodyBlock {
  const key = requireString(member._key, `${field}._key`);

  switch (member._type) {
    case "bodyImage": {
      const caption = optionalString(member.caption);

      return {
        _type: "bodyImage",
        _key: key,
        image: resolveSanityImage(member, field),
        ...(caption ? { caption } : {}),
      };
    }

    case "embed": {
      // Refused in the Studio at publish time; refused again here so an
      // unrecognised provider can never reach the page (FR-002b).
      const embed = parseEmbedUrl(requireString(member.url, `${field}.url`));

      if (!embed) {
        throw new Error(
          `Sanity field "${field}.url" is not a Google Maps, YouTube or Vimeo embed link.`,
        );
      }

      return {
        _type: "embed",
        _key: key,
        provider: embed.provider,
        src: embed.src,
        title: requireString(member.title, `${field}.title`),
      };
    }

    default:
      // Portable Text blocks go to the renderer as Sanity sent them. Their
      // shape (children, marks, styles) is Sanity's own contract and is
      // bounded by the schema's allowed styles and marks; re-validating every
      // span here would duplicate the renderer's job for no extra safety.
      return member as unknown as PortableTextBlock;
  }
}

// ---------------------------------------------------------------------------
// Service landing pages (spec 014)

/**
 * A placeholder only the studio can fill must never reach a visitor. The
 * Studio refuses to switch a page on while one remains; this is the same rule
 * on the way out, for a page that arrived by import with the switch already on
 * (research.md §10).
 */
function rejectConfirmMarker(value: string, field: string) {
  if (value.includes(LANDING_CONFIRM_MARKER)) {
    throw new Error(
      `Sanity field "${field}" still contains a ${LANDING_CONFIRM_MARKER}: … placeholder. Replace it with the real detail.`,
    );
  }

  return value;
}

function requireLandingText(value: string | null | undefined, field: string) {
  return rejectConfirmMarker(requireString(value, field), field);
}

function requireLandingParagraphs(
  value: string[] | null | undefined,
  field: string,
) {
  return requireStringArray(value, field).map((paragraph) =>
    rejectConfirmMarker(paragraph, field),
  );
}

function mapLandingSummary(
  page: SanityLandingPage,
  fieldPrefix: string,
): LandingPageSummary {
  const slug = requireString(getSlug(page.slug), `${fieldPrefix}.slug`);

  if (!isLandingSlug(slug)) {
    throw new Error(
      `Sanity field "${fieldPrefix}.slug" must be lower-case letters, digits and hyphens, received "${slug}".`,
    );
  }

  const alternateName = optionalString(page.alternateName);

  return {
    slug,
    serviceName: requireLandingText(
      page.serviceName,
      `${fieldPrefix}.serviceName`,
    ),
    alternateName: alternateName
      ? rejectConfirmMarker(alternateName, `${fieldPrefix}.alternateName`)
      : undefined,
    category: requireLandingText(page.category, `${fieldPrefix}.category`),
    packageId: requireString(page.packageId, `${fieldPrefix}.packageId`),
    packageImage: resolveSanityImage(
      page.packageImage,
      `${fieldPrefix}.packageImage`,
    ),
    updatedAt: requireString(page._updatedAt, `${fieldPrefix}._updatedAt`),
  };
}

/**
 * Structural guards only: at least one section and one question, every field
 * non-blank. The word minimums are the Studio's
 * to enforce, not the site's — a page at 390 words is short, not missing, and
 * a runtime floor would take live pages down when the floor is raised later
 * (research.md §4b).
 */
function mapLandingPage(
  page: SanityLandingPage,
  fieldPrefix: string,
): LandingPage {
  const sections = requireValue(page.sections, `${fieldPrefix}.sections`);
  const faqs = requireValue(page.faqs, `${fieldPrefix}.faqs`);

  if (!sections.length) {
    throw new Error(
      `Sanity field "${fieldPrefix}.sections" must contain at least one section.`,
    );
  }

  if (!faqs.length) {
    throw new Error(
      `Sanity field "${fieldPrefix}.faqs" must contain at least one question.`,
    );
  }

  if (!page.package) {
    throw new Error(
      `Sanity document "${fieldPrefix}.package" is required — the service package it points to is missing or unpublished.`,
    );
  }

  return {
    ...mapLandingSummary(page, fieldPrefix),
    introduction: requireLandingParagraphs(
      page.introduction,
      `${fieldPrefix}.introduction`,
    ),
    sections: sections.map((section, index): LandingSection => ({
      heading: requireLandingText(
        section.heading,
        `${fieldPrefix}.sections[${index}].heading`,
      ),
      paragraphs: requireLandingParagraphs(
        section.body,
        `${fieldPrefix}.sections[${index}].body`,
      ),
    })),
    faqs: faqs.map((faq, index): LandingFaq => ({
      question: requireLandingText(
        faq.question,
        `${fieldPrefix}.faqs[${index}].question`,
      ),
      answer: requireLandingText(
        faq.answer,
        `${fieldPrefix}.faqs[${index}].answer`,
      ),
    })),
    seoTitle: requireLandingText(page.seoTitle, `${fieldPrefix}.seoTitle`),
    seoDescription: requireLandingText(
      page.seoDescription,
      `${fieldPrefix}.seoDescription`,
    ),
    package: mapSanityService(page.package, `${fieldPrefix}.package`),
  };
}

/** Live pages only: the filter is in the query (research.md §2). */
export async function getLandingPages(): Promise<LandingPageSummary[]> {
  const pages = await fetchSanity<SanityLandingPage[]>(
    landingPagesQuery,
    "service landing pages",
  );

  return pages.map((page, index) =>
    mapLandingSummary(page, `serviceLandingPage[${index}]`),
  );
}

/**
 * `null` for an unknown slug **and** for a held-back, draft-only or deleted
 * page — the query cannot tell them apart, and the page should not either.
 * Looked up per slug rather than checked against a shared list: under
 * stale-while-revalidate a shared list is stale on the first visit after a
 * publish, which would answer "no" for a page created seconds ago (research.md
 * §1).
 */
export async function getLandingPageBySlug(
  slug: string,
): Promise<LandingPage | null> {
  const page = await fetchSanity<SanityLandingPage | null>(
    landingPageBySlugQuery,
    `the "${slug}" service landing page`,
    { slug },
  );

  return page ? mapLandingPage(page, `serviceLandingPage("${slug}")`) : null;
}

export async function getLandingPageSlugs(): Promise<string[]> {
  const slugs = await fetchSanity<(string | null)[]>(
    landingPageSlugsQuery,
    "service landing page slugs",
  );

  return slugs.filter((slug): slug is string => Boolean(slug?.trim()));
}

export async function getLandingPageSettings(): Promise<LandingPageSettings> {
  const settings = requireDocument(
    await fetchSanity<SanityLandingSettings | null>(
      landingSettingsQuery,
      "the service landing page settings",
    ),
    "serviceLandingSettings",
  );
  const headingPattern = requireString(
    settings.headingPattern,
    "serviceLandingSettings.headingPattern",
  );

  for (const placeholder of Object.values(HEADING_PLACEHOLDERS)) {
    if (!headingPattern.includes(placeholder)) {
      throw new Error(
        `Sanity field "serviceLandingSettings.headingPattern" must contain ${placeholder}.`,
      );
    }
  }

  return {
    headingPattern,
    projectsHeading: requireString(
      settings.projectsHeading,
      "serviceLandingSettings.projectsHeading",
    ),
    packageHeading: requireString(
      settings.packageHeading,
      "serviceLandingSettings.packageHeading",
    ),
    packageBookLabel: requireString(
      settings.packageBookLabel,
      "serviceLandingSettings.packageBookLabel",
    ),
    faqHeading: requireString(
      settings.faqHeading,
      "serviceLandingSettings.faqHeading",
    ),
    cta: {
      heading: requireString(
        settings.ctaHeading,
        "serviceLandingSettings.ctaHeading",
      ),
      body: requireString(settings.ctaBody, "serviceLandingSettings.ctaBody"),
      contactLabel: requireString(
        settings.ctaContactLabel,
        "serviceLandingSettings.ctaContactLabel",
      ),
    },
  };
}

/**
 * Ready-made link text for the services page and the project pages, which
 * never compose a heading themselves. With no live page it returns before
 * reading any settings, so the build — which calls this from the services page
 * and every project page — does not depend on the settings document until a
 * page is actually live.
 */
export async function getLandingPageLinks(): Promise<LandingPageLink[]> {
  const pages = await getLandingPages();

  if (!pages.length) {
    return [];
  }

  const [siteSettings, settings] = await Promise.all([
    getSiteSettings(),
    getLandingPageSettings(),
  ]);

  return pages.map((page) => ({
    slug: page.slug,
    href: `/${page.slug}`,
    heading: composeLandingHeading({
      pattern: settings.headingPattern,
      serviceName: page.serviceName,
      alternateName: page.alternateName,
      city: siteSettings.location,
    }),
    packageId: page.packageId,
    category: page.category,
  }));
}
