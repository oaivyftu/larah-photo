import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteSettings } from "@/types/site";

// An async Server Component, tested the way the work detail page is: call it,
// await the element, render that. Every route on the site goes through this
// shell, so its two accessibility affordances -- the skip link and the
// focusable main -- are worth holding in place.

const getSiteSettings = vi.fn<() => Promise<SiteSettings>>();

vi.mock("@/sanity/fetchers", () => ({
  getSiteSettings: () => getSiteSettings(),
}));

const { PageShell } = await import("./PageShell");

const settings = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 555 0100",
  location: "Ontario",
  priceCurrency: "CAD",
  footerStatement: "Shot on location.",
  navigationItems: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
  ],
} as unknown as SiteSettings;

async function renderShell(
  variant: Parameters<typeof PageShell>[0]["variant"] = "work",
  children?: React.ReactNode,
) {
  return render(await PageShell({ variant, children }));
}

beforeEach(() => {
  getSiteSettings.mockReset();
  getSiteSettings.mockResolvedValue(settings);
});

afterEach(cleanup);

describe("PageShell", () => {
  it("renders its children inside the main landmark", async () => {
    await renderShell("work", <p>Page body</p>);

    expect(screen.getByRole("main")).toHaveTextContent("Page body");
  });

  it("offers a skip link that targets the main landmark", async () => {
    await renderShell();

    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("makes main a programmatic focus target for the skip link", async () => {
    // Without tabIndex the browser jumps but leaves focus behind, so the next
    // Tab continues from the header rather than from the content.
    await renderShell();

    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("makes the top of the page focusable for the footer's back-to-top", async () => {
    await renderShell();

    const top = document.querySelector("#top");
    expect(top).toHaveAttribute("tabindex", "-1");
  });

  it("declares the studio identity once, for the page graphs to reference", async () => {
    await renderShell();

    const blocks = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(blocks).toHaveLength(1);
    expect(JSON.parse(blocks[0]!.innerHTML)).toMatchObject({
      name: "Larah Photo",
    });
  });

  it.each([
    ["home", "/"],
    ["work", "/work"],
    ["project", "/work"],
    ["about", "/about"],
  ] as const)(
    "marks %s as the current nav route (%s)",
    async (variant, href) => {
      await renderShell(variant);

      const current = document.querySelector("[aria-current='page']");
      // Only /work and /about are in this fixture's nav; / and others match none.
      if (settings.navigationItems.some((item) => item.href === href)) {
        expect(current).toHaveAttribute("href", href);
      } else {
        expect(current).toBeNull();
      }
    },
  );

  it("hides the header brand on the home page only", async () => {
    const { container: home } = await renderShell("home");
    const homeBrand = home.querySelector("header a")?.className;
    cleanup();

    const { container: work } = await renderShell("work");
    const workBrand = work.querySelector("header a")?.className;

    expect(homeBrand).not.toBe(workBrand);
  });

  it("lets a Sanity failure surface rather than rendering a shell with no header", async () => {
    getSiteSettings.mockRejectedValue(
      new Error('Sanity document "siteSettings" is required.'),
    );

    await expect(PageShell({ variant: "work" })).rejects.toThrow(
      'Sanity document "siteSettings" is required.',
    );
  });
});
