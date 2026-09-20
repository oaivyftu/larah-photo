import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalPageContent, JournalPostSummary } from "@/types/journal";
import type { SiteSettings } from "@/types/site";

// The journal index, called and awaited like the post route. `PageShell` is a
// passthrough here for the same reason as there: it is an async Server
// Component with its own test file (spec 013 FR-013–FR-016, FR-018, FR-020).

const getJournalPosts = vi.fn<() => Promise<JournalPostSummary[]>>();
const getJournalPage = vi.fn<() => Promise<JournalPageContent>>();
const getSiteSettings = vi.fn<() => Promise<SiteSettings>>();
const shellVariant = vi.fn<(variant: string) => void>();

vi.mock("@/sanity/fetchers", () => ({
  getJournalPosts: () => getJournalPosts(),
  getJournalPage: () => getJournalPage(),
  getSiteSettings: () => getSiteSettings(),
}));

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

function summary(slug: string, title: string, publishedAt: string) {
  return {
    slug,
    title,
    excerpt: `${title}, briefly.`,
    publishedAt,
    updatedAt: `${publishedAt}T12:00:00Z`,
    category: "Location Guide",
    location: "London, Ontario",
    coverImage: {
      src: `https://cdn.sanity.io/images/p/d/${slug}.jpg`,
      alt: `${title} cover`,
      width: 1600,
      height: 1067,
    },
    bodyImages: [],
  } satisfies JournalPostSummary;
}

// Newest first, as the query returns them.
const posts = [
  summary("springbank-guide", "Springbank Park", "2026-09-10"),
  summary("covent-garden-market", "Covent Garden Market", "2026-08-02"),
];

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

beforeEach(() => {
  getJournalPosts.mockReset();
  getJournalPage.mockReset();
  getJournalPage.mockResolvedValue(journalPage);
  getSiteSettings.mockResolvedValue({
    location: "London, Ontario",
  } as SiteSettings);
  shellVariant.mockReset();
});

afterEach(cleanup);

async function renderIndex(list: JournalPostSummary[]) {
  getJournalPosts.mockResolvedValue(list);
  return render(await page.default());
}

function jsonLd(type: string) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => JSON.parse(node.innerHTML) as Record<string, unknown>)
    .find((graph) => graph["@type"] === type);
}

describe("journal index", () => {
  it("lists every live post once, in the order the query gave", async () => {
    const { container } = await renderIndex(posts);

    const cards = container.querySelectorAll(
      "[data-journal-list] [data-journal-card]",
    );

    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Springbank Park");
    expect(cards[1]).toHaveTextContent("Covent Garden Market");
  });

  it("shows each post's cover, title, excerpt and date, linked to the post", async () => {
    const { container } = await renderIndex(posts);

    const [first] = container.querySelectorAll("[data-journal-card]");

    expect(screen.getByAltText("Springbank Park cover")).toBeInTheDocument();
    expect(first).toHaveTextContent("Springbank Park, briefly.");
    expect(first!.querySelector("time")).toHaveAttribute(
      "dateTime",
      "2026-09-10",
    );
    expect(
      screen.getByRole("link", { name: "Springbank Park" }),
    ).toHaveAttribute("href", "/journal/springbank-guide");
  });

  it("uses the editor's heading", async () => {
    await renderIndex(posts);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "The Journal",
    );
  });

  it("shows the editor's empty-state message, and no list, when nothing is live", async () => {
    const { container } = await renderIndex([]);

    expect(container.querySelector("[data-journal-empty]")).toHaveTextContent(
      "New stories are on their way.",
    );
    expect(container.querySelector("[data-journal-list]")).toBeNull();
  });

  it("raises when the journal settings are missing, rather than guessing a heading", async () => {
    getJournalPosts.mockResolvedValue(posts);
    getJournalPage.mockRejectedValue(
      new Error('Sanity document "journalPage" is required.'),
    );

    await expect(page.default()).rejects.toThrow("journalPage");
  });

  it("asks the shell to mark the journal as the current section", async () => {
    await renderIndex(posts);

    expect(shellVariant).toHaveBeenCalledWith("journal");
  });

  it("describes itself as a collection with a Home › Journal trail", async () => {
    await renderIndex(posts);

    expect(jsonLd("CollectionPage")).toMatchObject({
      mainEntity: { numberOfItems: 2 },
    });
    expect(jsonLd("BreadcrumbList")).toMatchObject({
      itemListElement: [
        { position: 1, name: "Home" },
        { position: 2, name: "Journal" },
      ],
    });
  });
});

describe("journal index metadata", () => {
  it("is canonical at /journal and names the studio's location", async () => {
    getJournalPosts.mockResolvedValue(posts);

    const metadata = await page.generateMetadata();

    expect(metadata.title).toBe("Journal");
    expect(metadata.alternates?.canonical).toBe("/journal");
    expect(metadata.description).toContain("London, Ontario");
  });

  it("uses the newest post's cover as its social card", async () => {
    getJournalPosts.mockResolvedValue(posts);

    const metadata = await page.generateMetadata();
    const [ogImage] = [metadata.openGraph?.images].flat();

    expect(ogImage).toMatchObject({ alt: "Springbank Park cover" });
  });

  it("leaves the image to the site default when there is no post", async () => {
    getJournalPosts.mockResolvedValue([]);

    const metadata = await page.generateMetadata();

    expect(metadata.openGraph?.images).toBeUndefined();
  });
});
