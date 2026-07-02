import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getAboutPage } from "@/sanity/fetchers";
import { AboutExperience } from "./AboutExperience";

export default async function AboutPage() {
  const content = await getAboutPage();

  return (
    <PageShell variant="about">
      <AboutExperience content={content} />
    </PageShell>
  );
}
