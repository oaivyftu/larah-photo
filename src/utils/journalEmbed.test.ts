import { describe, expect, it } from "vitest";
import {
  EMBED_PROVIDERS,
  EMBED_REJECTION_MESSAGE,
  parseEmbedUrl,
} from "./journalEmbed";

// Every row here is a row of specs/013-journal-section/contracts/embed-providers.md.
// The allow-list is the security control for third-party frames on the site
// (there is no sandbox behind it), so what it refuses matters as much as what
// it accepts.

const YOUTUBE_ID = "dQw4w9WgXcQ";
const NOCOOKIE = `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`;

describe("accepted inputs normalise to the no-tracking URL", () => {
  it.each([
    `https://www.youtube.com/watch?v=${YOUTUBE_ID}`,
    `https://youtube.com/watch?v=${YOUTUBE_ID}&t=42s&si=abc`,
    `https://youtu.be/${YOUTUBE_ID}`,
    `https://youtu.be/${YOUTUBE_ID}?si=share-tracker`,
    `https://www.youtube.com/embed/${YOUTUBE_ID}`,
  ])("YouTube: %s", (input) => {
    expect(parseEmbedUrl(input)).toEqual({
      provider: "youtube",
      src: NOCOOKIE,
    });
  });

  it.each([
    "https://vimeo.com/76979871",
    "https://www.vimeo.com/76979871?share=copy",
    "https://player.vimeo.com/video/76979871",
  ])("Vimeo: %s", (input) => {
    expect(parseEmbedUrl(input)).toEqual({
      provider: "vimeo",
      src: "https://player.vimeo.com/video/76979871?dnt=1",
    });
  });

  it("Google Maps: keeps the pb parameter, which is the map itself", () => {
    const pb = "!1m18!1m12!1m3!1d2919.5!2d-81.3!3d42.9";

    expect(
      parseEmbedUrl(`https://www.google.com/maps/embed?pb=${pb}&hl=en&extra=1`),
    ).toEqual({
      provider: "google-maps",
      src: `https://www.google.com/maps/embed?pb=${pb}`,
    });
  });

  it("upgrades http to https rather than rejecting it", () => {
    expect(parseEmbedUrl(`http://youtu.be/${YOUTUBE_ID}`)?.src).toBe(NOCOOKIE);
  });

  it("tolerates surrounding whitespace from a paste", () => {
    expect(parseEmbedUrl(`  https://youtu.be/${YOUTUBE_ID}\n`)?.src).toBe(
      NOCOOKIE,
    );
  });
});

describe("everything else is refused", () => {
  it.each([
    ["an unlisted host", "https://www.dailymotion.com/video/x7tgad0"],
    [
      "a look-alike host",
      `https://youtube.com.evil.example/watch?v=${YOUTUBE_ID}`,
    ],
    ["a YouTube id of the wrong length", "https://youtu.be/short"],
    ["a YouTube watch URL with no id", "https://www.youtube.com/watch"],
    ["a YouTube channel page", "https://www.youtube.com/@larahphoto"],
    ["a Vimeo URL with no numeric id", "https://vimeo.com/channels/staffpicks"],
    ["a Maps embed with no pb", "https://www.google.com/maps/embed"],
    [
      "the keyed Maps Embed API",
      "https://www.google.com/maps/embed/v1/place?key=abc&q=Springbank+Park",
    ],
    ["a plain Maps link", "https://maps.app.goo.gl/abc123"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a data: URL", "data:text/html,<script>alert(1)</script>"],
    ["something that is not a URL", "Springbank Park"],
    ["an empty paste", ""],
  ])("%s", (_label, input) => {
    expect(parseEmbedUrl(input)).toBeNull();
  });
});

describe("the refusal message", () => {
  it("names every provider an editor could use instead", () => {
    for (const provider of EMBED_PROVIDERS) {
      expect(EMBED_REJECTION_MESSAGE).toContain(provider.label);
    }
  });
});
