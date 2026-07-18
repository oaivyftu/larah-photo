import type { ProjectImage } from "@/types/project";

export type SiteSettings = {
  name: string;
  instagramUrl: string;
  instagramDisplayUrl: string;
  instagramHandle: string;
  email: string;
  phone: string;
  location: string;
  footerStatement: string;
};

export type HomePageContent = {
  eyebrow: string;
  titleWords: string[];
  heroImage?: ProjectImage;
  manifestoWords: [string, string, string];
  manifestoImageOne: ProjectImage;
  manifestoImageTwo: ProjectImage;
  selectedWorkEyebrow: string;
  servicesEyebrow: string;
  servicesTitle: string;
};

export type WorkPageContent = {
  eyebrow: string;
  titleWords: string[];
  indexLabel: string;
};

export type AboutPageContent = {
  eyebrow: string;
  titleWords: string[];
  largeText: string;
  portraitOne: ProjectImage;
  portraitTwo: ProjectImage;
  notes: string[];
  story: string[];
};

export type ContactPageContent = {
  eyebrow: string;
  titleWords: string[];
  largeText: string;
  fastestRouteLabel: string;
  fastestRouteTitle: string;
  locationLabel: string;
  locationTitle: string;
  locationDescription: string;
  image: ProjectImage;
  formEyebrow: string;
  formTitle: string;
  formCopy: string;
};

export type ServicePageContent = {
  eyebrow: string;
  titleWords: string[];
  image: ProjectImage;
  imageCopy: string;
};
