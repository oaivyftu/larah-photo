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

export const servicesQuery = `*[_type == "servicePackage"] | order(index asc, title asc){
  _id,
  id,
  index,
  title,
  description,
  features,
  price,
  image{${imageFields}},
  ctaHref
}`;

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
