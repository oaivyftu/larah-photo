import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JournalEmbed } from "./JournalEmbed";

// The rendering half of specs/013-journal-section/contracts/embed-providers.md.
// The URL has already been matched and normalised by the fetcher; what this
// component owns is the frame's own behaviour — accessible name, deferred
// load, no autoplay, and no pretend isolation.

afterEach(cleanup);

const embed = {
  _type: "embed",
  _key: "e1",
  provider: "youtube",
  src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  title: "A walk along the river path",
} as const;

function frame() {
  return screen.getByTitle("A walk along the river path");
}

describe("JournalEmbed", () => {
  it("names the frame with the editor's description", () => {
    render(<JournalEmbed embed={embed} />);

    expect(frame().tagName).toBe("IFRAME");
    expect(frame()).toHaveAttribute("src", embed.src);
  });

  it("identifies the provider on its wrapper", () => {
    const { container } = render(<JournalEmbed embed={embed} />);

    expect(
      container.querySelector('figure[data-journal-embed="youtube"]'),
    ).toContainElement(frame());
  });

  it("does not load until the reader scrolls near it", () => {
    render(<JournalEmbed embed={embed} />);

    expect(frame()).toHaveAttribute("loading", "lazy");
  });

  it("limits what the provider learns about the page", () => {
    render(<JournalEmbed embed={embed} />);

    expect(frame()).toHaveAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin",
    );
  });

  it("allows fullscreen but never autoplay", () => {
    render(<JournalEmbed embed={embed} />);

    expect(frame()).toHaveAttribute("allowfullscreen");
    expect(frame().getAttribute("allow") ?? "").not.toMatch(/autoplay/);
  });

  it("carries no sandbox, which would isolate nothing for these providers", () => {
    render(<JournalEmbed embed={embed} />);

    expect(frame()).not.toHaveAttribute("sandbox");
  });
});
