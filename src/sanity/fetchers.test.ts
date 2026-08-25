import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

// The whole point of this file: every CMS read in the app funnels through
// `sanityClient.fetch`, so mocking that one module boundary is enough to
// exercise the fetchers with no network involved (research.md §3).
vi.mock("./client", () => ({
  sanityClient: { fetch: vi.fn() },
}));

// Without this the module reads real env vars, and an unset
// NEXT_PUBLIC_SANITY_PROJECT_ID would short-circuit every fetcher with
// "Sanity is required to load ..." before the mocked client is ever reached.
vi.mock("./env", () => ({
  sanityProjectId: "test-project",
  sanityDataset: "test",
  sanityApiVersion: "2026-07-01",
  isSanityConfigured: true,
}));

const { sanityClient } = await import("./client");

// The real `client.fetch` is generic and heavily overloaded, so its inferred
// return type (`RawQuerylessQueryResponse`) rejects the plain fixture objects
// these tests resolve with. The stub only ever needs to hand back an arbitrary
// shape, so it is narrowed to a bare Mock rather than loosened with `any`
// (constitution Technology Constraints).
const fetchMock = sanityClient.fetch as unknown as Mock;

// `fetchSanityCached` is wrapped in React's `cache()`, so a query already
// resolved in this module instance would be served from memory rather than
// re-entering the mock. Resetting modules per test gives each one a clean
// memo table and a clean mock.
beforeEach(() => {
  fetchMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadFetchers() {
  return import("./fetchers");
}

const siteSettingsDoc = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 555 0100",
  location: "Ontario",
  footerStatement: "Shot on location.",
  navigationItems: [{ label: "Work", href: "/work" }],
};

describe("success path", () => {
  it("maps and filters slugs returned by the CMS", async () => {
    fetchMock.mockResolvedValue(["harbour-light", null, "  ", "dune-study"]);
    const { getWorkProjectSlugs } = await loadFetchers();

    await expect(getWorkProjectSlugs()).resolves.toEqual([
      "harbour-light",
      "dune-study",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("defaults priceCurrency to CAD when the field is absent", async () => {
    fetchMock.mockResolvedValue(siteSettingsDoc);
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).resolves.toMatchObject({
      name: "Larah Photo",
      priceCurrency: "CAD",
    });
  });

  it("returns null for an unknown slug instead of throwing", async () => {
    fetchMock.mockResolvedValue(null);
    const { getWorkProjectBySlug } = await loadFetchers();

    await expect(getWorkProjectBySlug("nope")).resolves.toBeNull();
  });
});

// Constitution Principle I: missing content surfaces as an error, it never
// degrades into a silent fallback or placeholder.
describe("content validation failures surface, never fall back", () => {
  it("throws when a required field is missing", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, email: undefined });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.email" is required.',
    );
  });

  it("throws when a required field is present but blank", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, name: "   " });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.name" cannot be empty.',
    );
  });

  it("throws when the whole document is missing", async () => {
    fetchMock.mockResolvedValue(null);
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity document "siteSettings" is required.',
    );
  });

  it("throws when a required list is empty", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, navigationItems: [] });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.navigationItems" must contain at least one item.',
    );
  });
});

describe("transport failures are wrapped, not swallowed", () => {
  it("labels which read failed and preserves the original error as cause", async () => {
    const underlying = new Error("ECONNRESET");
    fetchMock.mockRejectedValue(underlying);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).rejects.toThrow(
      "Unable to load work projects from Sanity.",
    );

    fetchMock.mockRejectedValue(underlying);
    vi.resetModules();
    const { getWorkProjects: retry } = await loadFetchers();
    await expect(retry()).rejects.toMatchObject({ cause: underlying });
  });
});

describe("no real network is reached", () => {
  it("never calls global fetch, only the mocked client", async () => {
    const globalFetch = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValue(["harbour-light"]);
    const { getWorkProjectSlugs } = await loadFetchers();

    await getWorkProjectSlugs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
  });
});
