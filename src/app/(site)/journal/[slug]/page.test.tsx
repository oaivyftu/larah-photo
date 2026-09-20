import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalPageContent, JournalPost } from "@/types/journal";

// The post route, called and awaited like `work/[slug]/page.test.tsx` does.
// That file only checks an element comes back; this one renders it, because
// the requirements here are about what a reader actually gets — the single
// h1, the date as a date, the onward links (spec 013 FR-009–FR-012).
//
// `PageShell` is an async Server Component with its own Sanity read and its
// own test file. Testing Library cannot render one nested inside another, so
// it is replaced with a passthrough; the page's contract with it is just the
// variant it asks for.

const getJournalPostBySlug =
  vi.fn<(slug: string) => Promise<JournalPost | null>>();
const getJournalPostSlugs = vi.fn<() => Promise<string[]>>();
const getJournalPage = vi.fn<() => Promise<JournalPageContent>>();
const shellVariant = vi.fn<(variant: string) => void>();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/sanity/fetchers", () => ({
  getJournalPostBySlug: (slug: string) => getJournalPostBySlug(slug),
  getJournalPostSlugs: () => getJournalPostSlugs(),
  getJournalPage: () => getJournalPage(),
}));

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

vi.mock("@/components/layout/PageShell/PageShell", () => ({
  PageShell: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant: string;
  }) => {
    shellVariant(variant);
    return <main>{children}</main>;
  },
}));

const page = await import("./page");

const post: JournalPost = {
  slug: "springbank-engagement-guide",
  title: "Engagement photos at Springbank Park",
  excerpt: "Where to stand, when to go, and what the light does.",
  publishedAt: "2026-09-01",
  updatedAt: "2026-09-10T12:00:00Z",
  category: "Location Guide",
  location: "Springbank Park, London, Ontario",
  coverImage: {
    src: "https://cdn.sanity.io/images/p/d/cover.jpg",
    alt: "Couple on the footbridge",
    width: 1600,
    height: 1067,
  },
  bodyImages: [],
  body: [
    {
      _type: "block",
      _key: "b1",
      style: "h2",
      markDefs: [],
      children: [{ _type: "span", _key: "s1", text: "Go early", marks: [] }],
    },
  ],
};

const journalPage: JournalPageContent = {
  titleWords: ["The", "Journal"],
  emptyStateMessage: "New stories are on their way.",
  cta: {
    heading: "Planning something here?",
    body: "Tell me about it.",
    contactLabel: "Get in touch",
    workLabel: "See the work",
  },
};

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  getJournalPostBySlug.mockReset();
  getJournalPage.mockReset();
  getJournalPage.mockResolvedValue(journalPage);
  shellVariant.mockReset();
  notFound.mockClear();
});

afterEach(cleanup);

async function renderPost() {
  getJournalPostBySlug.mockResolvedValue(post);
  return render(await page.default(params(post.slug)));
}

function jsonLd(type: string) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => JSON.parse(node.innerHTML) as Record<string, unknown>)
    .find((graph) => graph["@type"] === type);
}

describe("journal post page", () => {
  it("404s for an unknown or scheduled slug", async () => {
    getJournalPostBySlug.mockResolvedValue(null);

    await expect(page.default(params("not-yet"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();
  });

  it("lets a content error surface rather than hiding it as a 404", async () => {
    getJournalPostBySlug.mockRejectedValue(
      new Error('Sanity field "journalPost("x").title" cannot be empty.'),
    );

    await expect(page.default(params("x"))).rejects.toThrow("cannot be empty");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("raises when the journal settings are missing, as the CTA needs them", async () => {
    getJournalPostBySlug.mockResolvedValue(post);
    getJournalPage.mockRejectedValue(
      new Error('Sanity document "journalPage" is required.'),
    );

    await expect(page.default(params(post.slug))).rejects.toThrow(
      "journalPage",
    );
  });

  it("gives the title the page's only h1, above the body's own headings", async () => {
    await renderPost();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      post.title,
    );
    // The body's own headings and the call to action's both sit beneath it.
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Go early", "Planning something here?"]);
  });

  it("shows the date as a date, the place and the category", async () => {
    const { container } = await renderPost();

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("dateTime", "2026-09-01");
    expect(time).toHaveTextContent("September 1, 2026");
    expect(screen.getByText(post.location)).toBeInTheDocument();
    expect(screen.getByText(post.category)).toBeInTheDocument();
  });

  it("shows the cover with its alt text", async () => {
    await renderPost();

    expect(screen.getByAltText(post.coverImage.alt)).toBeInTheDocument();
  });

  it("ends with a way on to the contact page and the work, in the editor's words", async () => {
    const { container } = await renderPost();

    const cta = container.querySelector("[data-journal-cta]");
    expect(cta).toHaveTextContent("Planning something here?");
    expect(screen.getByRole("link", { name: /Get in touch/ })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: /See the work/ })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("asks the shell to mark the journal as the current section", async () => {
    await renderPost();

    expect(shellVariant).toHaveBeenCalledWith("journalPost");
  });

  it("describes itself as a BlogPosting with a Home › Journal › post trail", async () => {
    await renderPost();

    expect(jsonLd("BlogPosting")).toMatchObject({ headline: post.title });
    expect(jsonLd("BreadcrumbList")).toMatchObject({
      itemListElement: [
        { position: 1, name: "Home" },
        { position: 2, name: "Journal" },
        { position: 3, name: post.title },
      ],
    });
  });
});

describe("journal post metadata", () => {
  it("marks an unknown post noindex rather than titling a 404 plausibly", async () => {
    getJournalPostBySlug.mockResolvedValue(null);

    await expect(page.generateMetadata(params("nope"))).resolves.toMatchObject({
      title: "Post not found",
      robots: { index: false },
    });
  });

  it("falls back to the title and excerpt when no override is set", async () => {
    getJournalPostBySlug.mockResolvedValue(post);

    const metadata = await page.generateMetadata(params(post.slug));

    expect(metadata.title).toBe(post.title);
    expect(metadata.description).toBe(post.excerpt);
  });

  it("uses the editor's search title and description when set", async () => {
    getJournalPostBySlug.mockResolvedValue({
      ...post,
      seoTitle: "Springbank Park engagement photos",
      seoDescription: "A local guide.",
    });

    const metadata = await page.generateMetadata(params(post.slug));

    expect(metadata.title).toBe("Springbank Park engagement photos");
    expect(metadata.description).toBe("A local guide.");
  });

  it("is canonical at its own URL, with the cover as its social card", async () => {
    getJournalPostBySlug.mockResolvedValue(post);

    const metadata = await page.generateMetadata(params(post.slug));
    const [ogImage] = [metadata.openGraph?.images].flat();

    expect(metadata.alternates?.canonical).toBe(`/journal/${post.slug}`);
    expect(ogImage).toMatchObject({ alt: post.coverImage.alt, width: 1200 });
  });
});

describe("generateStaticParams", () => {
  it("prerenders live slugs only, which is all the query returns", async () => {
    getJournalPostSlugs.mockResolvedValue(["springbank-engagement-guide"]);

    await expect(page.generateStaticParams()).resolves.toEqual([
      { slug: "springbank-engagement-guide" },
    ]);
  });

  it("prerenders nothing rather than failing when no post is live", async () => {
    getJournalPostSlugs.mockResolvedValue([]);

    await expect(page.generateStaticParams()).resolves.toEqual([]);
  });
});
