import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import {
  getLandingPageLinks,
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
  const [services, settings] = await Promise.all([
    getServices(),
    getSiteSettings(),
  ]);
  // `Math.min()` of nothing is Infinity, which would ship "starting at $Infinity"
  // into the search snippet if the packages were ever unpublished.
  const startingPrice = services.length
    ? Math.min(...services.map((service) => service.price))
    : undefined;
  const [leadService] = services;

  return pageMetadata({
    title: "Services",
    description: services.length
      ? `Photography session packages from Larah Photo in ${settings.location} ` +
        `— ${services.length} options covering ` +
        `${services.map((service) => service.title).join(", ")}, ` +
        `starting at $${startingPrice}.`
      : `Photography session packages, inclusions and pricing from Larah ` +
        `Photo in ${settings.location}.`,
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
  const [content, services, settings, landingPageLinks] = await Promise.all([
    getServicePage(),
    getServices(),
    getSiteSettings(),
    getLandingPageLinks(),
  ]);
  // Keyed by package id, the key `getServices` already uses, so a package with
  // no live landing page simply has no entry and renders as it always did.
  const landingLinks = Object.fromEntries(
    landingPageLinks.map((link) => [
      link.packageId,
      { href: link.href, label: link.heading },
    ]),
  );

  return (
    <PageShell variant="service">
      <JsonLd data={buildServiceListSchema(services, settings.priceCurrency)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/service" },
        ])}
      />
      <ServiceExperience
        content={content}
        landingLinks={landingLinks}
        services={services}
      />
    </PageShell>
  );
}
