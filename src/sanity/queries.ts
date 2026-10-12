export const imageFields = `
  alt,
  asset->{
    url,
    metadata {
      lqip,
      dimensions {
        width,
        height
      }
    }
  }
`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  name,
  instagramUrl,
  googleBusinessUrl,
  email,
  phone,
  location,
  priceCurrency,
  postalAddress{
    streetAddress,
    locality,
    region,
    postalCode,
    country
  },
  footerStatement,
  navigationItems[]{
    label,
    href
  }
}`;

export const homePageQuery = `*[_type == "homePage"][0]{
  heroTagline,
  heroPortraitImage{${imageFields}},
  heroImage{${imageFields}},
  heroCtaLabel,
  heroCtaHref,
  manifestoWords,
  manifestoImageOne{${imageFields}},
  manifestoImageTwo{${imageFields}},
  selectedWorkEyebrow,
  servicesEyebrow
}`;

export const workPageQuery = `*[_type == "workPage"][0]{
  titleWords
}`;

export const aboutPageQuery = `*[_type == "aboutPage"][0]{
  titleWords,
  portraitOne{${imageFields}},
  story
}`;

export const contactPageQuery = `*[_type == "contactPage"][0]{
  titleWords
}`;

export const servicePageQuery = `*[_type == "servicePage"][0]{
  titleWords
}`;

/**
 * One projection of a service package, shared by the services page and the
 * landing page's `package->{…}` join, so a price or image rule changed here
 * changes on both and the two pages cannot disagree (spec 014 research.md §5).
 */
export const servicePackageFields = `
  _id,
  id,
  index,
  title,
  description,
  features,
  price,
  image{${imageFields}},
  ctaHref
`;

export const servicesQuery = `*[_type == "servicePackage"] | order(index asc, title asc){${servicePackageFields}}`;

const projectFields = `
  _id,
  slug,
  title,
  meta,
  category,
  year,
  location,
  serviceCategory,
  description,
  cardImage{${imageFields}},
  featured,
  featuredOrder,
  homepageSpan,
  images[]{
    ${imageFields}
  }
`;

export const projectsQuery = `*[_type == "workProject"] | order(featuredOrder asc, title asc){${projectFields}}`;

/**
 * `/work/[slug]` renders one project, so it fetches one project — pulling the
 * whole gallery down to `.find()` in memory made every detail page pay for
 * every other project's image metadata.
 */
export const projectBySlugQuery = `*[_type == "workProject" && slug.current == $slug][0]{${projectFields}}`;

/** Slugs only — all `generateStaticParams` and the sitemap actually need. */
export const projectSlugsQuery = `*[_type == "workProject" && defined(slug.current)].slug.current`;

export const journalPageQuery = `*[_type == "journalPage"][0]{
  titleWords,
  emptyStateMessage,
  ctaHeading,
  ctaBody,
  ctaContactLabel,
  ctaWorkLabel
}`;

/**
 * Every public journal read goes through this filter, so none can omit the
 * schedule (spec 013 FR-007a, research.md §2). A post whose `publishedAt` is
 * still ahead of `$today` — the date in the studio's time zone, supplied by
 * the fetchers — is simply not there: not on the listing, not at its URL, not
 * in the sitemap. `$today` and `publishedAt` are both `YYYY-MM-DD`, which
 * compare correctly as strings.
 */
export const liveJournalPostFilter = `_type == "journalPost" && defined(slug.current) && publishedAt <= $today`;

const journalPostSummaryFields = `
  _updatedAt,
  slug,
  title,
  excerpt,
  publishedAt,
  category,
  location,
  coverImage{${imageFields}},
  "bodyImages": body[_type == "bodyImage"]{${imageFields}}
`;

/** Newest first; `_createdAt` settles posts sharing a date, so the order is
 *  stable across requests (FR-013). */
export const journalPostsQuery = `*[${liveJournalPostFilter}] | order(publishedAt desc, _createdAt desc){${journalPostSummaryFields}}`;

export const journalPostBySlugQuery = `*[${liveJournalPostFilter} && slug.current == $slug][0]{
  ${journalPostSummaryFields},
  seoTitle,
  seoDescription,
  body[]{
    ...,
    _type == "bodyImage" => {
      _type,
      _key,
      caption,
      ${imageFields}
    }
  }
}`;

export const journalPostSlugsQuery = `*[${liveJournalPostFilter}].slug.current`;

export const landingSettingsQuery = `*[_type == "serviceLandingSettings"][0]{
  headingPattern,
  projectsHeading,
  packageHeading,
  packageBookLabel,
  faqHeading,
  ctaHeading,
  ctaBody,
  ctaContactLabel
}`;

/**
 * Every public landing-page read is built from this filter, so none can omit
 * the switch — the same reason `liveJournalPostFilter` exists (spec 014
 * research.md §2). Together with the client's `published` perspective, which a
 * Studio draft never matches, it is the whole of "live": published in the
 * Studio AND switched on. `approvedAgainstBrief` is deliberately not here: it
 * gates the switch in the Studio, and a second runtime gate would make "why is
 * this page not showing?" a two-variable question.
 */
export const liveLandingPageFilter = `_type == "serviceLandingPage" && published == true && defined(slug.current)`;

const landingPageSummaryFields = `
  _updatedAt,
  slug,
  serviceName,
  alternateName,
  category,
  "packageId": coalesce(package->id, package->_id),
  "packageImage": package->image{${imageFields}}
`;

/** Summaries for the sitemap, the inbound links and the static params. */
export const landingPagesQuery = `*[${liveLandingPageFilter}] | order(serviceName asc){${landingPageSummaryFields}}`;

export const landingPageBySlugQuery = `*[${liveLandingPageFilter} && slug.current == $slug][0]{
  ${landingPageSummaryFields},
  introduction,
  sections[]{heading, body},
  faqs[]{question, answer},
  seoTitle,
  seoDescription,
  "package": package->{${servicePackageFields}}
}`;

export const landingPageSlugsQuery = `*[${liveLandingPageFilter}].slug.current`;
