import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { getWorkPage, getWorkProjects } from "@/sanity/fetchers";
import { WorkGalleryClient } from "./WorkGalleryClient";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected photography projects and galleries.",
};

export default async function WorkPage() {
  const [content, projects] = await Promise.all([
    getWorkPage(),
    getWorkProjects(),
  ]);

  return (
    <PageShell variant="work">
      <WorkGalleryClient content={content} projects={projects} />
    </PageShell>
  );
}
