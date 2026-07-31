import type { ProjectImage } from "@/types/project";
import type { NavigationItem } from "@/types/navigation";

export type SiteSettings = {
  name: string;
  instagramUrl: string;
  email: string;
  phone: string;
  location: string;
  footerStatement: string;
  navigationItems: NavigationItem[];
};

export type HomePageContent = {
  eyebrow: string;
  titleWords: string[];
  heroImage: ProjectImage;
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
  formCopy: string;
};

export type ServicePageContent = {
  titleWords: string[];
};
