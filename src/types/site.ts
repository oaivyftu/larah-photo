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

export type SiteSettings = {
  name: string;
  instagramUrl: string;
  email: string;
  phone: string;
  location: string;
  /** ISO 4217 code for the package prices. Structured data only. */
  priceCurrency: string;
  postalAddress?: PostalAddress;
  footerStatement: string;
  navigationItems: NavigationItem[];
};

export type HomePageContent = {
  heroTagline: string;
  heroPortraitImage: ProjectImage;
  heroImage: ProjectImage;
  heroBrandmark: string;
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
