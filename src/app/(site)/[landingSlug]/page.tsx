import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { LandingCta } from "@/components/landing/LandingCta/LandingCta";
import { LandingFaq } from "@/components/landing/LandingFaq/LandingFaq";
import { LandingPackage } from "@/components/landing/LandingPackage/LandingPackage";
import { LandingProjects } from "@/components/landing/LandingProjects/LandingProjects";
import { LandingSections } from "@/components/landing/LandingSections/LandingSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { isReservedRootSegment } from "@/constants/reservedRoutes";
import { pageMetadata } from "@/constants/seo";
import {
  getLandingPageBySlug,
  getLandingPageSettings,
  getLandingPageSlugs,
  getSiteSettings,
  getWorkProjects,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import { categoriesMatch } from "@/utils/formatWorkCategory";
import { composeLandingHeading, headingWords } from "@/utils/landingHeading";
import { isLandingSlug } from "@/utils/landingSlug";
import {
  buildBreadcrumbSchema,
  buildLandingFaqSchema,
  buildLandingServiceSchema,
} from "@/utils/structuredData";
import { LandingExperience } from "./LandingExperience";
import styles from "./landing.module.scss";

type LandingPageProps = {
  params: Promise<{
    landingSlug: string;
  }>;
};

/**
 * Whether a root path could be a landing page at all. Decided before any CMS
 * read: bot traffic for `/wp-login.php` or `/.env` (both hold a dot) and a
 * stale link to a reserved segment then cost nothing (spec 014 research.md §1).
 */
function couldBeLandingPage(segment: string) {
  return isLandingSlug(segment) && !isReservedRootSegment(segment);
}

/** A crawler reading only the head must not file a 404 under a plausible
 *  title. */
const notLive: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { landingSlug } = await params;

  if (!couldBeLandingPage(landingSlug)) {
    return notLive;
  }

  const page = await getLandingPageBySlug(landingSlug);

  if (!page) {
    return notLive;
  }

  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/${page.slug}`,
    images: [
      toOpenGraphImage({
        src: page.package.image,
        alt: page.package.imageAlt,
      }),
    ],
  });
}

/**
 * Live slugs only. `dynamicParams` is left at its default (`true`) on purpose:
 * a page an editor publishes after the last build must render on its first
 * request instead of 404ing until the next deploy (FR-009). `false` would make
 * every new page a code change.
 */
export async function generateStaticParams() {
  const slugs = await getLandingPageSlugs();

  return slugs.map((landingSlug) => ({ landingSlug }));
}

export default async function LandingPageRoute({ params }: LandingPageProps) {
  const { landingSlug } = await params;

  if (!couldBeLandingPage(landingSlug)) {
    notFound();
  }

  // Looked up by this slug, not checked against a shared list: under
  // stale-while-revalidate a list is stale on the first visit after a publish,
  // and that visit would answer "no" for a page created seconds ago.
  const page = await getLandingPageBySlug(landingSlug);

  if (!page) {
    notFound();
  }

  // After the 404 check, so an unknown slug never pays for the settings and
  // work reads, and before rendering, so missing settings raise rather than
  // rendering a page with no call to action.
  const [settings, siteSettings, projects] = await Promise.all([
    getLandingPageSettings(),
    getSiteSettings(),
    getWorkProjects(),
  ]);

  const heading = composeLandingHeading({
    pattern: settings.headingPattern,
    serviceName: page.serviceName,
    alternateName: page.alternateName,
    city: siteSettings.location,
  });
  const matchingProjects = projects.filter((project) =>
    categoriesMatch(project.category, page.category),
  );

  return (
    <PageShell variant="landing">
      <JsonLd
        data={buildLandingServiceSchema(
          page,
          siteSettings.location,
          siteSettings.priceCurrency,
        )}
      />
      <JsonLd data={buildLandingFaqSchema(page)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/service" },
          { name: heading, path: `/${page.slug}` },
        ])}
      />
      <LandingExperience>
        <header className={styles["landing__header"]}>
          <PageHeading id="landing-title" words={headingWords(heading)} />
        </header>

        {/* The order of the page lives here, in one place: explain, show proof,
            price, answer objections, ask (research.md §9). */}
        <div className={styles["landing__body"]}>
          <div className={styles["landing__intro"]} data-landing-intro>
            {page.introduction.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <LandingSections sections={page.sections} />
          <LandingProjects
            heading={settings.projectsHeading}
            projects={matchingProjects}
          />
          <LandingPackage
            bookLabel={settings.packageBookLabel}
            heading={settings.packageHeading}
            servicePackage={page.package}
          />
          <LandingFaq faqs={page.faqs} heading={settings.faqHeading} />
          <LandingCta cta={settings.cta} />
        </div>
      </LandingExperience>
    </PageShell>
  );
}
