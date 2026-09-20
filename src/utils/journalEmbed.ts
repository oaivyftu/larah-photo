import type { EmbedProvider } from "../types/journal";

/**
 * The embed allow-list — specs/013-journal-section/contracts/embed-providers.md.
 *
 * This is the security control for third-party frames on journal pages. There
 * is deliberately no `sandbox` behind it (these providers need
 * `allow-scripts allow-same-origin`, which together isolate nothing), so what
 * this refuses is the whole of the protection. Changing it is a reviewed
 * change with a test per new pattern, not a quick edit.
 *
 * Every accepted URL is rebuilt from the parts we recognise rather than passed
 * through, which is what guarantees the no-tracking variants: an editor
 * pasting an ordinary youtube.com link still gets youtube-nocookie.com, and
 * whatever tracking parameters rode along in the paste are dropped.
 */

export const EMBED_PROVIDERS = [
  { id: "google-maps", label: "Google Maps" },
  { id: "youtube", label: "YouTube" },
  { id: "vimeo", label: "Vimeo" },
] as const satisfies readonly { id: EmbedProvider; label: string }[];

export const EMBED_REJECTION_MESSAGE =
  "Only Google Maps (Share → Embed a map), YouTube and Vimeo links can be " +
  "embedded. Paste a link from one of those.";

export type ParsedEmbed = { provider: EmbedProvider; src: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d+$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com"]);

function youtube(id: string | null | undefined): ParsedEmbed | null {
  return id && YOUTUBE_ID.test(id)
    ? {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${id}`,
      }
    : null;
}

function vimeo(id: string | undefined): ParsedEmbed | null {
  return id && VIMEO_ID.test(id)
    ? { provider: "vimeo", src: `https://player.vimeo.com/video/${id}?dnt=1` }
    : null;
}

/** Path segments without empty strings, so trailing slashes don't matter. */
function segments(url: URL) {
  return url.pathname.split("/").filter(Boolean);
}

/**
 * The provider and the URL to render, or `null` when the input is not one of
 * the accepted shapes. Pure; no network.
 */
export function parseEmbedUrl(input: string): ParsedEmbed | null {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const path = segments(url);

  if (YOUTUBE_HOSTS.has(host)) {
    if (path.length === 1 && path[0] === "watch") {
      return youtube(url.searchParams.get("v"));
    }

    if (path.length === 2 && path[0] === "embed") {
      return youtube(path[1]);
    }

    return null;
  }

  if (host === "youtu.be") {
    return path.length === 1 ? youtube(path[0]) : null;
  }

  if (VIMEO_HOSTS.has(host)) {
    return path.length === 1 ? vimeo(path[0]) : null;
  }

  if (host === "player.vimeo.com") {
    return path.length === 2 && path[0] === "video" ? vimeo(path[1]) : null;
  }

  // Only the share-embed URL. `/maps/embed/v1/…` is the keyed Embed API,
  // which would mean provisioning a secret; it fails the exact-path check.
  if (host === "www.google.com" && url.pathname === "/maps/embed") {
    const pb = url.searchParams.get("pb");

    return pb
      ? {
          provider: "google-maps",
          src: `https://www.google.com/maps/embed?pb=${encodeURIComponent(pb).replace(/%21/g, "!")}`,
        }
      : null;
  }

  return null;
}
