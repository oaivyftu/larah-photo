import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import {
  getServicePage,
  getServices,
  getSiteSettings,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import {
  buildBreadcrumbSchema,
  buildServiceListSchema,
} from "@/utils/structuredData";
import { ServiceExperience } from "./ServiceExperience";

export async function generateMetadata(): Promise<Metadata> {
  const services = await getServices();
  // `Math.min()` of nothing is Infinity, which would ship "starting at $Infinity"
  // into the search snippet if the packages were ever unpublished.
  const startingPrice = services.length
    ? Math.min(...services.map((service) => service.price))
    : undefined;
  const [leadService] = services;

  return pageMetadata({
    title: "Services",
    description: services.length
      ? `Photography session packages from Larah Photo — ${services.length} ` +
        `options covering ${services.map((service) => service.title).join(", ")}, ` +
        `starting at $${startingPrice}.`
      : "Photography session packages, inclusions and pricing from Larah Photo.",
    path: "/service",
    images: leadService
      ? [
          toOpenGraphImage({
            src: leadService.image,
            alt: leadService.imageAlt,
          }),
        ]
      : undefined,
  });
}

export default async function ServicePage() {
  const [content, services, settings] = await Promise.all([
    getServicePage(),
    getServices(),
    getSiteSettings(),
  ]);

  return (
    <PageShell variant="service">
      <JsonLd data={buildServiceListSchema(services, settings.priceCurrency)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/service" },
        ])}
      />
      <ServiceExperience content={content} services={services} />
    </PageShell>
  );
}
