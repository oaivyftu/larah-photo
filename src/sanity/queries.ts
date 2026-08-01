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
  footerStatement,
  navigationItems[]{
    label,
    href
  }
}`;

export const homePageQuery = `*[_type == "homePage"][0]{
  eyebrow,
  titleWords,
  heroImage{${imageFields}},
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
  titleWords,
  formCopy
}`;

export const servicePageQuery = `*[_type == "servicePage"][0]{
  titleWords
}`;

/* Just the titles — the contact route validates the submitted session type
   against these and has no use for the rest of the document. */
export const serviceTitlesQuery = `*[_type == "servicePackage"].title`;

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

export const projectsQuery = `*[_type == "workProject"] | order(featuredOrder asc, title asc){
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
}`;
