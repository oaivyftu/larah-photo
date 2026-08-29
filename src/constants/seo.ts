import type { Metadata } from "next";

/**
 * Search engine visibility is opt-in: the site stays fully hidden until
 * `NEXT_PUBLIC_SITE_INDEXABLE` is explicitly set to "true" in the environment.
 *
 * To launch: set NEXT_PUBLIC_SITE_INDEXABLE=true on the Production environment
 * only, then redeploy. Preview and development deployments stay blocked.
 */
export const isIndexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Every canonical, OG URL, sitemap entry and JSON-LD `@id` is built from this
 * value, so a production deploy that forgot to set it would publish an entire
 * site of URLs pointing at localhost. Indexing is the point of no return, so
 * fail the build rather than ship links no crawler can follow.
 */
if (
  isIndexable &&
  /^https?:\/\/(localhost|127\.0\.0\.1)/.test(configuredSiteUrl)
) {
  throw new Error(
    'NEXT_PUBLIC_SITE_INDEXABLE is "true" but NEXT_PUBLIC_SITE_URL is still ' +
      `${configuredSiteUrl}. Set NEXT_PUBLIC_SITE_URL to the public origin ` +
      "before enabling indexing.",
  );
}

/** Normalised without a trailing slash so `${siteUrl}/path` never doubles up. */
export const siteUrl = configuredSiteUrl.replace(/\/+$/, "");

export const siteName = "Larah Photo";

/**
 * Google Search Console domain verification, and the GA4 measurement ID.
 * Both are optional and undefined until set — the root layout only renders
 * the corresponding `<meta>`/script when a value is present, so an empty
 * environment produces no broken tags.
 */
export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined;

export const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;

export const siteDescription =
  "Larah Photo is a London, Ontario photography studio shooting portrait, " +
  "wedding and editorial work. Browse selected projects, session packages " +
  "and enquire about a booking.";

/**
 * Absolute URL for a site-relative path. The sitemap and JSON-LD both need
 * one: unlike the Metadata API, neither resolves relative URLs against
 * `metadataBase`.
 */
export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  /** Site-relative, with a leading slash. Becomes the canonical and OG URL. */
  path: string;
  /** Overrides the site-wide OG image, e.g. with a project's own photograph. */
  images?: NonNullable<Metadata["openGraph"]>["images"];
  /**
   * Skips the root `%s | Larah Photo` template. Only the home page wants
   * this — its title already leads with the brand, and the template would
   * append it a second time.
   */
  absoluteTitle?: boolean;
};

/**
 * Builds the per-route metadata every page needs. Canonicals have to be set
 * per route — `metadataBase` resolves relative URLs but cannot infer the
 * current path — and `/work/[slug]` needs one especially, since the
 * intercepting modal route renders the same content at the same URL.
 */
export function pageMetadata({
  title,
  description,
  path,
  images,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      locale: "en_US",
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
