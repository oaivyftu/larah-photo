export const imageFields = `
  _type,
  alt,
  asset->{
    url,
    metadata {
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
  footerStatement
}`;

export const homePageQuery = `*[_type == "homePage"][0]{
  eyebrow,
  titleWords,
  heroImage{${imageFields}},
  manifestoWords,
  manifestoCopy,
  manifestoImageOne{${imageFields}},
  manifestoImageTwo{${imageFields}},
  selectedWorkEyebrow,
  selectedWorkTitle,
  servicesEyebrow,
  servicesTitle,
  closingImage{${imageFields}},
  closingTitle
}`;

export const workPageQuery = `*[_type == "workPage"][0]{
  eyebrow,
  titleWords,
  indexLabel
}`;

export const aboutPageQuery = `*[_type == "aboutPage"][0]{
  eyebrow,
  titleWords,
  largeText,
  portraitOne{${imageFields}},
  portraitTwo{${imageFields}},
  notes,
  story
}`;

export const contactPageQuery = `*[_type == "contactPage"][0]{
  eyebrow,
  titleWords,
  largeText,
  fastestRouteLabel,
  fastestRouteTitle,
  locationLabel,
  locationTitle,
  locationDescription,
  image{${imageFields}},
  formEyebrow,
  formTitle,
  formCopy
}`;

export const servicePageQuery = `*[_type == "servicePage"][0]{
  eyebrow,
  titleWords,
  image{${imageFields}},
  imageCopy
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

export const projectsQuery = `*[_type == "workProject"] | order(featuredOrder asc, title asc){
  _id,
  slug,
  title,
  meta,
  category,
  tags,
  year,
  location,
  clientSubject,
  serviceCategory,
  description,
  cardImage{${imageFields}},
  featured,
  featuredOrder,
  homepageSpan,
  workSpan,
  heroImage{${imageFields}},
  images[]{
    layout,
    image{${imageFields}}
  }
}`;
