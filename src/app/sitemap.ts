import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/constants/seo";
import { getWorkProjects } from "@/sanity/fetchers";

/**
 * `changeFrequency` and `priority` are hints Google has said it ignores, so
 * they are left off: `lastModified` plus a complete URL list is the part that
 * actually earns anything.
 *
 * Project entries carry their photographs as image sitemap entries — on a
 * portfolio the images are the content worth surfacing in Google Images, and
 * they are otherwise only reachable behind client-side gallery interaction.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getWorkProjects();
  const lastModified = new Date();

  const staticRoutes = ["/", "/work", "/service", "/about", "/contact"].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified,
    }),
  );

  const projectRoutes = projects.map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    lastModified,
    images: [project.image, ...project.images.map((image) => image.src)],
  }));

  return [...staticRoutes, ...projectRoutes];
}
