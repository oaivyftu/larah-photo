import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/constants/seo";
import { getJournalPosts, getWorkProjects } from "@/sanity/fetchers";

/**
 * `changeFrequency` and `priority` are hints Google has said it ignores, so
 * they are left off: `lastModified` plus a complete URL list is the part that
 * actually earns anything.
 *
 * Project entries carry their photographs as image sitemap entries — on a
 * portfolio the images are the content worth surfacing in Google Images, and
 * they are otherwise only reachable behind client-side gallery interaction.
 *
 * Journal posts carry their own `lastModified` — the post's last edit, which
 * Sanity already tracks — where every other entry is stamped with the build.
 * An edited article's freshness is worth telling a crawler about; a project
 * gallery's is not (spec 013 research.md §6). Only live posts are listed: the
 * schedule is enforced by the query, and nothing here adds to it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, journalPosts] = await Promise.all([
    getWorkProjects(),
    getJournalPosts(),
  ]);
  const lastModified = new Date();

  const staticRoutes = [
    "/",
    "/work",
    "/service",
    "/about",
    "/contact",
    "/journal",
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
  }));

  const projectRoutes = projects.map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    lastModified,
    images: [project.image, ...project.images.map((image) => image.src)],
  }));

  const journalRoutes = journalPosts.map((post) => ({
    url: absoluteUrl(`/journal/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    images: [post.coverImage.src, ...post.bodyImages.map((image) => image.src)],
  }));

  return [...staticRoutes, ...projectRoutes, ...journalRoutes];
}
