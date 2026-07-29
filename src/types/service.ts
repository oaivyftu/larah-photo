export type ServicePackage = {
  id: string;
  index: string;
  title: string;
  description: string;
  features: string[];
  price: number;
  image: string;
  imageBlurDataURL?: string;
  imageAlt: string;
  ctaHref: string;
};
