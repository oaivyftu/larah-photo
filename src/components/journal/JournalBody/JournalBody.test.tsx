import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { JournalBodyBlock } from "@/types/journal";
import { JournalBody } from "./JournalBody";

// A post body is what makes the journal read as an article rather than a
// string of paragraphs (spec 013 FR-002). Every member type the Studio offers
// appears once in the fixture below, so a renderer that forgets one fails here
// rather than rendering it as nothing on a live page.

afterEach(cleanup);

function block(
  key: string,
  text: string,
  extra: Record<string, unknown> = {},
): JournalBodyBlock {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    ...extra,
  } as JournalBodyBlock;
}

const body: JournalBodyBlock[] = [
  block("h2", "Where to stand", { style: "h2" }),
  block("h3", "The footbridge", { style: "h3" }),
  block("h4", "Timing", { style: "h4" }),
  block("q", "The light goes gold at seven.", { style: "blockquote" }),
  block("li1", "Bring a blanket", { listItem: "bullet", level: 1 }),
  block("li2", "Park on Springbank Drive", { listItem: "bullet", level: 1 }),
  block("n1", "Arrive early", { listItem: "number", level: 1 }),
  {
    _type: "block",
    _key: "marks",
    style: "normal",
    markDefs: [
      { _type: "link", _key: "in", href: "/work" },
      { _type: "link", _key: "out", href: "https://londonparks.example" },
    ],
    children: [
      { _type: "span", _key: "m1", text: "Bold", marks: ["strong"] },
      { _type: "span", _key: "m2", text: " and ", marks: [] },
      { _type: "span", _key: "m3", text: "italic", marks: ["em"] },
      { _type: "span", _key: "m4", text: ", see the ", marks: [] },
      { _type: "span", _key: "m5", text: "gallery", marks: ["in"] },
      { _type: "span", _key: "m6", text: " or the ", marks: [] },
      { _type: "span", _key: "m7", text: "park site", marks: ["out"] },
    ],
  } as JournalBodyBlock,
  {
    _type: "bodyImage",
    _key: "img1",
    image: {
      src: "https://cdn.sanity.io/images/p/d/river.jpg",
      alt: "The river at golden hour",
      width: 1600,
      height: 1067,
    },
    caption: "The east bank, 7pm in June.",
  },
  {
    _type: "bodyImage",
    _key: "img2",
    image: {
      src: "https://cdn.sanity.io/images/p/d/bridge.jpg",
      alt: "The footbridge from below",
      width: 1600,
      height: 1067,
    },
  },
  {
    _type: "embed",
    _key: "e1",
    provider: "google-maps",
    src: "https://www.google.com/maps/embed?pb=!1m18",
    title: "Map of Springbank Park",
  },
];

describe("JournalBody", () => {
  it("renders headings beneath the page title, and never a second h1", () => {
    render(<JournalBody body={body} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Where to stand",
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "The footbridge",
    );
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      "Timing",
    );
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders the pull quote as a quotation", () => {
    const { container } = render(<JournalBody body={body} />);

    expect(container.querySelector("blockquote")).toHaveTextContent(
      "The light goes gold at seven.",
    );
  });

  it("keeps bulleted and numbered lists as lists", () => {
    const { container } = render(<JournalBody body={body} />);

    expect(
      within(container.querySelector("ul")!).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(container.querySelector("ol")).toHaveTextContent("Arrive early");
  });

  it("keeps bold and italic as emphasis", () => {
    const { container } = render(<JournalBody body={body} />);

    expect(container.querySelector("strong")).toHaveTextContent("Bold");
    expect(container.querySelector("em")).toHaveTextContent("italic");
  });

  it("treats site links as internal and others as external", () => {
    render(<JournalBody body={body} />);

    const internal = screen.getByRole("link", { name: "gallery" });
    const external = screen.getByRole("link", { name: "park site" });

    expect(internal).toHaveAttribute("href", "/work");
    expect(internal).not.toHaveAttribute("rel");
    expect(external).toHaveAttribute("href", "https://londonparks.example");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("puts alt text on the image and the caption under it, never one for the other", () => {
    render(<JournalBody body={body} />);

    const image = screen.getByAltText("The river at golden hour");
    const figure = image.closest("figure");

    expect(figure?.querySelector("figcaption")).toHaveTextContent(
      "The east bank, 7pm in June.",
    );
  });

  it("renders no empty caption when the editor wrote none", () => {
    render(<JournalBody body={body} />);

    const figure = screen
      .getByAltText("The footbridge from below")
      .closest("figure");

    expect(figure?.querySelector("figcaption")).toBeNull();
  });

  it("renders an embed through the embed component", () => {
    render(<JournalBody body={body} />);

    expect(screen.getByTitle("Map of Springbank Park")).toHaveAttribute(
      "loading",
      "lazy",
    );
  });

  it("marks its root as the article body", () => {
    const { container } = render(<JournalBody body={body} />);

    expect(container.querySelector("[data-journal-article]")).not.toBeNull();
  });
});
