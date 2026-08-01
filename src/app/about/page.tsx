import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getAboutPage } from "@/sanity/fetchers";
import { AboutExperience } from "./AboutExperience";

export const metadata: Metadata = {
  title: "About",
  description: "About Larah — photographer, and the story behind the work.",
};

export default async function AboutPage() {
  const content = await getAboutPage();

  return (
    <PageShell variant="about">
      <AboutExperience content={content} />
    </PageShell>
  );
}
