import type { ProjectImage } from "@/types/project";
import type { NavigationItem } from "@/types/navigation";

/** Structured-data only: never rendered, and every part is optional because
 *  a studio without a walk-in address still gets the rest of its schema. */
export type PostalAddress = {
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

/** Structured-data only. Both halves or neither: a lone latitude pins nothing. */
export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

/** One row of opening hours: the days it applies to and a same-day window. */
export type OpeningHoursRange = {
  days: string[];
  /** 24-hour "HH:MM". */
  opens: string;
  /** 24-hour "HH:MM", later the same day than `opens`. */
  closes: string;
};

export type SiteSettings = {
  name: string;
  instagramUrl: string;
  /** Structured data only: joins this site to the Maps listing via `sameAs`. */
  googleBusinessUrl?: string;
  email: string;
  phone: string;
  location: string;
  /** ISO 4217 code for the package prices. Structured data only. */
  priceCurrency: string;
  postalAddress?: PostalAddress;
  /** Structured data only: a photograph of the studio for local rich results. */
  businessImageUrl?: string;
  geo?: GeoCoordinates;
  openingHours?: OpeningHoursRange[];
  /** Structured data only, e.g. "$300-$450". */
  priceRange?: string;
  footerStatement: string;
  navigationItems: NavigationItem[];
};

export type HomePageContent = {
  heroTagline: string;
  heroPortraitImage: ProjectImage;
  heroImage: ProjectImage;
  heroCtaLabel: string;
  heroCtaHref: string;
  manifestoWords: [string, string, string];
  manifestoImageOne: ProjectImage;
  manifestoImageTwo: ProjectImage;
  selectedWorkEyebrow: string;
  servicesEyebrow: string;
};

export type WorkPageContent = {
  titleWords: string[];
};

export type AboutPageContent = {
  titleWords: string[];
  portraitOne: ProjectImage;
  story: string[];
};

export type ContactPageContent = {
  titleWords: string[];
};

export type ServicePageContent = {
  titleWords: string[];
};
