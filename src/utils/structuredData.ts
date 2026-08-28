import { absoluteUrl, siteDescription, siteName } from "@/constants/seo";
import type { Project } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import type { PostalAddress, SiteSettings } from "@/types/site";

/**
 * Stable `@id`s let the separate JSON-LD blocks on a page reference one
 * another instead of each restating the business, so a crawler resolves them
 * into a single entity rather than several look-alikes.
 */
export const businessId = absoluteUrl("/#business");
export const websiteId = absoluteUrl("/#website");

type JsonLdGraph = Record<string, unknown>;

/** Drops keys whose value is undefined or an empty string. Schema.org treats a
 *  present-but-empty property as a claim, and validators flag it. */
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== "",
    ),
  ) as T;
}

function buildPostalAddress(address: PostalAddress | undefined) {
  if (!address) {
    return undefined;
  }

  const postalAddress = compact({
    "@type": "PostalAddress",
    streetAddress: address.streetAddress,
    addressLocality: address.locality,
    addressRegion: address.region,
    postalCode: address.postalCode,
    addressCountry: address.country,
  });

  // Only "@type" survived, so there is nothing to describe.
  return Object.keys(postalAddress).length > 1 ? postalAddress : undefined;
}

/**
 * The studio itself. `ProfessionalService` is the schema.org branch a
 * photography business belongs to and inherits everything `LocalBusiness`
 * offers, so search engines can treat it as a local entity once an address
 * is filled in.
 */
export function buildBusinessSchema(settings: SiteSettings): JsonLdGraph {
  return compact({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": businessId,
    name: settings.name,
    alternateName: settings.name === siteName ? undefined : siteName,
    description: siteDescription,
    url: absoluteUrl("/"),
    email: settings.email,
    telephone: settings.phone,
    address: buildPostalAddress(settings.postalAddress),
    areaServed: settings.location,
    sameAs: [settings.instagramUrl, settings.googleBusinessUrl].filter(Boolean),
    knowsAbout: [
      "Portrait photography",
      "Wedding photography",
      "Editorial photography",
    ],
  });
}

export function buildWebSiteSchema(): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: siteName,
    description: siteDescription,
    url: absoluteUrl("/"),
    inLanguage: "en",
    publisher: { "@id": businessId },
  };
}

/**
 * One `Service` per package, wrapped in the `ItemList` that describes the page
 * as a whole. `AggregateOffer.lowPrice` rather than `Offer.price`, because the
 * CMS field is a starting price and the UI says "From $x" — quoting it as the
 * price would be a claim the studio does not make.
 */
export function buildServiceListSchema(
  services: ServicePackage[],
  priceCurrency: string,
): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Photography packages by ${siteName}`,
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: compact({
        "@type": "Service",
        name: service.title,
        description: service.description,
        serviceType: service.title,
        url: absoluteUrl("/service"),
        image: service.image,
        provider: { "@id": businessId },
        offers: {
          "@type": "AggregateOffer",
          lowPrice: service.price,
          priceCurrency,
          availability: "https://schema.org/InStock",
        },
      }),
    })),
  };
}

export function buildAboutPageSchema(story: string[]): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${siteName}`,
    description: story.join(" "),
    url: absoluteUrl("/about"),
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    mainEntity: { "@id": businessId },
  };
}

export function buildContactPageSchema(settings: SiteSettings): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${siteName}`,
    url: absoluteUrl("/contact"),
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@id": businessId,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Booking enquiries",
        email: settings.email,
        telephone: settings.phone,
        areaServed: settings.location,
        availableLanguage: "English",
      },
    },
  };
}

/**
 * The work index as a browsable collection. The grid is filtered and laid out
 * client-side, so the `ItemList` is what states the full set of projects and
 * their URLs in the server HTML.
 */
export function buildWorkCollectionSchema(projects: Project[]): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Work by ${siteName}`,
    url: absoluteUrl("/work"),
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    about: { "@id": businessId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.title,
        url: absoluteUrl(`/work/${project.slug}`),
      })),
    },
  };
}

/**
 * A project page is a gallery of photographs. Listing them as `ImageObject`s
 * is the only way the images become discoverable to Google Images — the
 * gallery itself only mounts them through client-side interaction.
 */
export function buildProjectSchema(project: Project): JsonLdGraph {
  const url = absoluteUrl(`/work/${project.slug}`);
  const images = [
    { src: project.image, alt: project.alt },
    ...project.images.map((image) => ({ src: image.src, alt: image.alt })),
  ];

  return compact({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${url}#gallery`,
    name: project.title,
    description: project.description,
    url,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    author: { "@id": businessId },
    copyrightHolder: { "@id": businessId },
    contentLocation: project.location,
    genre: project.category,
    // `year` is free text in the CMS, so only a clean four-digit year is
    // promoted to a date — schema.org expects ISO 8601 and a validator
    // rejects anything else.
    datePublished: /^\d{4}$/.test(project.year) ? project.year : undefined,
    image: images.map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.src,
      url: image.src,
      caption: image.alt,
      creditText: siteName,
      creator: { "@id": businessId },
      copyrightNotice: `© ${siteName}`,
    })),
  });
}

export function buildBreadcrumbSchema(
  trail: { name: string; path: string }[],
): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
