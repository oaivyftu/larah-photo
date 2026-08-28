import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import { getAboutPage } from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import {
  buildAboutPageSchema,
  buildBreadcrumbSchema,
} from "@/utils/structuredData";
import { AboutExperience } from "./AboutExperience";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutPage();

  return pageMetadata({
    title: "About",
    // The opening paragraph of the CMS story, so the snippet is the
    // photographer's own words rather than boilerplate.
    description: content.story[0],
    path: "/about",
    images: [toOpenGraphImage(content.portraitOne)],
  });
}

export default async function AboutPage() {
  const content = await getAboutPage();

  return (
    <PageShell variant="about">
      <JsonLd data={buildAboutPageSchema(content.story)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <AboutExperience content={content} />
    </PageShell>
  );
}
