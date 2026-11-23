import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalPageContent, JournalPostSummary } from "@/types/journal";
import type { SiteSettings } from "@/types/site";

// Later pages of the journal listing (spec 013 FR-016a to FR-016c). Called and
// awaited like the other Server Components; `notFound` and `permanentRedirect`
// throw in the real runtime, so they throw here too.

const getJournalPosts = vi.fn<() => Promise<JournalPostSummary[]>>();
const getJournalPage = vi.fn<() => Promise<JournalPageContent>>();
const getSiteSettings = vi.fn<() => Promise<SiteSettings>>();
const notFound = vi.fn(() => {
  throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
});
const permanentRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT;${path}`);
});

vi.mock("@/sanity/fetchers", () => ({
  getJournalPosts: () => getJournalPosts(),
  getJournalPage: () => getJournalPage(),
  getSiteSettings: () => getSiteSettings(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
  permanentRedirect: (path: string) => permanentRedirect(path),
}));

vi.mock("@/components/layout/PageShell/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

const route = await import("./page");

function summary(index: number): JournalPostSummary {
  const slug = `post-${index}`;

  return {
    slug,
    title: `Post ${index}`,
    excerpt: `Post ${index}, briefly.`,
    publishedAt: "2026-09-10",
    updatedAt: "2026-09-10T12:00:00Z",
    category: "Location Guide",
    location: "London, Ontario",
    coverImage: {
      src: `https://cdn.sanity.io/images/p/d/${slug}.jpg`,
      alt: `Post ${index} cover`,
      width: 1600,
      height: 1067,
    },
    bodyImages: [],
  };
}

// Twenty-nine posts: pages of 12, 12 and 5.
const posts = Array.from({ length: 29 }, (_, index) => summary(index + 1));

const journalPage: JournalPageContent = {
  titleWords: ["The", "Journal"],
  emptyStateMessage: "New stories are on their way.",
};

const params = (page: string) => ({ params: Promise.resolve({ page }) });

beforeEach(() => {
  getJournalPosts.mockReset();
  getJournalPosts.mockResolvedValue(posts);
  getJournalPage.mockReset();
  getJournalPage.mockResolvedValue(journalPage);
  getSiteSettings.mockResolvedValue({
    location: "London, Ontario",
  } as SiteSettings);
  notFound.mockClear();
  permanentRedirect.mockClear();
});

afterEach(cleanup);

function jsonLd(type: string) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => JSON.parse(node.innerHTML) as Record<string, unknown>)
    .find((graph) => graph["@type"] === type);
}

describe("journal page n", () => {
  it("shows the posts for that page and nothing from the others", async () => {
    const { container } = render(await route.default(params("2")));

    const cards = container.querySelectorAll("[data-journal-card]");

    expect(cards).toHaveLength(12);
    expect(cards[0]).toHaveTextContent("Post 13");
    expect(cards[11]).toHaveTextContent("Post 24");
  });

  it("shows the short remainder on the last page", async () => {
    const { container } = render(await route.default(params("3")));

    expect(container.querySelectorAll("[data-journal-card]")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: "Next page" })).toBeNull();
  });

  it("links back to page 1 at /journal and on to the next page", async () => {
    render(await route.default(params("2")));

    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/journal",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/journal/page/3",
    );
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
  });

  it("is a collection page of its own, counting positions across the journal", async () => {
    render(await route.default(params("2")));

    const collection = jsonLd("CollectionPage") as {
      url: string;
      mainEntity: {
        numberOfItems: number;
        itemListElement: { position: number }[];
      };
    };

    expect(collection.url).toBe("http://localhost:3000/journal/page/2");
    expect(collection.mainEntity.numberOfItems).toBe(12);
    expect(
      collection.mainEntity.itemListElement.map((item) => item.position),
    ).toEqual(Array.from({ length: 12 }, (_, index) => 13 + index));
  });

  it("extends the breadcrumb trail to the page", async () => {
    render(await route.default(params("2")));

    expect(jsonLd("BreadcrumbList")).toMatchObject({
      itemListElement: [
        { position: 1, name: "Home" },
        { position: 2, name: "Journal" },
        { position: 3, name: "Page 2" },
      ],
    });
  });

  describe("when there is no such page", () => {
    it.each(["4", "99"])("%s is beyond the last page: not found", async (n) => {
      await expect(route.default(params(n))).rejects.toThrow("404");
      expect(notFound).toHaveBeenCalled();
    });

    it.each(["0", "-1", "02", "1.5", "abc", ""])(
      "%j is not a page number: not found",
      async (segment) => {
        await expect(route.default(params(segment))).rejects.toThrow("404");
        expect(notFound).toHaveBeenCalled();
      },
    );

    it("does not read the settings for a page that does not exist", async () => {
      await expect(route.default(params("99"))).rejects.toThrow("404");

      expect(getJournalPage).not.toHaveBeenCalled();
    });
  });

  it("redirects page 1 to /journal, so no page has two addresses", async () => {
    await expect(route.default(params("1"))).rejects.toThrow("NEXT_REDIRECT");

    expect(permanentRedirect).toHaveBeenCalledWith("/journal");
  });

  it("raises when the journal settings are missing, rather than guessing a heading", async () => {
    getJournalPage.mockRejectedValue(
      new Error('Sanity document "journalPage" is required.'),
    );

    await expect(route.default(params("2"))).rejects.toThrow("journalPage");
  });
});

describe("journal page n metadata", () => {
  it("names the page and is canonical at its own address", async () => {
    const metadata = await route.generateMetadata(params("2"));

    expect(metadata.title).toBe("Journal — Page 2");
    expect(metadata.alternates?.canonical).toBe("/journal/page/2");
    expect(metadata.description).toContain("Page 2 of 3.");
    expect(metadata.description).toContain("London, Ontario");
  });

  it("uses the newest post on that page as its social card", async () => {
    const metadata = await route.generateMetadata(params("2"));
    const [ogImage] = [metadata.openGraph?.images].flat();

    expect(ogImage).toMatchObject({ alt: "Post 13 cover" });
  });

  it.each(["99", "abc", "1"])(
    "keeps %s out of the index: it is not a page",
    async (segment) => {
      const metadata = await route.generateMetadata(params(segment));

      expect(metadata.robots).toMatchObject({ index: false });
    },
  );
});

describe("journal page n static params", () => {
  it("lists pages 2 to the last one that exists", async () => {
    await expect(route.generateStaticParams()).resolves.toEqual([
      { page: "2" },
      { page: "3" },
    ]);
  });

  it("lists none when everything fits on one page", async () => {
    getJournalPosts.mockResolvedValue(posts.slice(0, 5));

    await expect(route.generateStaticParams()).resolves.toEqual([]);
  });
});
