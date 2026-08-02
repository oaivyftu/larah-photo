import type { Metadata } from "next";
import { NextStudio } from "next-sanity/studio";
import { metadata as studioMetadata } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export { viewport } from "next-sanity/studio";

/**
 * The Studio is an editor login, not a page. robots.txt already disallows it,
 * but that only stops crawling — a crawler that reaches the URL another way
 * still needs to be told not to index it.
 */
export const metadata: Metadata = {
  ...studioMetadata,
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <NextStudio config={config} />;
}
