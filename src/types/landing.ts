import type { ProjectImage } from "@/types/project";
import type { ServicePackage } from "@/types/service";

export type LandingFaq = { question: string; answer: string };

export type LandingSection = { heading: string; paragraphs: string[] };

/** From `getLandingPages()`: the sitemap, the inbound links and the static params. */
export type LandingPageSummary = {
  slug: string;
  serviceName: string;
  alternateName?: string;
  category: string;
  /** `coalesce(package->id, package->_id)`, the key the services page uses. */
  packageId: string;
  packageImage: ProjectImage;
  /** ISO timestamp of the page's last edit. */
  updatedAt: string;
};

/** From `getLandingPageBySlug()`. */
export type LandingPage = LandingPageSummary & {
  introduction: string[];
  sections: LandingSection[];
  faqs: LandingFaq[];
  seoTitle: string;
  seoDescription: string;
  package: ServicePackage;
};

/** From `getLandingPageLinks()`: ready link text for the services and project pages. */
export type LandingPageLink = {
  slug: string;
  href: string;
  /** Composed once; the link text, the breadcrumb and the `h1`. */
  heading: string;
  packageId: string;
  category: string;
};

export type LandingPageSettings = {
  headingPattern: string;
  projectsHeading: string;
  packageHeading: string;
  packageBookLabel: string;
  faqHeading: string;
  cta: { heading: string; body: string; contactLabel: string };
};
