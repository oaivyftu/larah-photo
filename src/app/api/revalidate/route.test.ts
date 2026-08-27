import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// The only endpoint in the app, and the only place an outside caller can make
// the server do work. Its failure modes are all security-shaped: an unsigned
// request that revalidates anyway, or a misconfigured secret that silently
// makes the webhook a no-op while the Studio reports success.
//
// Both boundaries are mocked -- next-sanity's signature check, because a real
// signature would mean shipping the HMAC scheme into the test, and
// revalidateTag, because it needs a Next request scope that does not exist
// here. What the test owns is the decision logic between them.

const parseBody = vi.fn();
const revalidateTag = vi.fn();

vi.mock("next-sanity/webhook", () => ({
  parseBody: (request: NextRequest, secret: string) =>
    parseBody(request, secret),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string, profile?: string) => revalidateTag(tag, profile),
}));

const { POST } = await import("./route");

const request = {} as NextRequest;
const originalEnv = { ...process.env };

beforeEach(() => {
  parseBody.mockReset();
  revalidateTag.mockReset();
  process.env["SANITY_REVALIDATE_SECRET"] = "shhh";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("revalidate webhook", () => {
  it("refuses to run unconfigured rather than accepting anything", async () => {
    // Without a secret there is nothing to verify against, so treating the
    // request as valid would leave the endpoint open to anyone.
    delete process.env["SANITY_REVALIDATE_SECRET"];

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "SANITY_REVALIDATE_SECRET is not configured.",
    });
    expect(parseBody).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects an unsigned request without touching the cache", async () => {
    parseBody.mockResolvedValue({
      isValidSignature: false,
      body: { _type: "project" },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a signed request whose payload has no document type", async () => {
    parseBody.mockResolvedValue({ isValidSignature: true, body: {} });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a signed request with no body at all", async () => {
    parseBody.mockResolvedValue({ isValidSignature: true, body: null });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("busts the Sanity cache tag for a valid webhook", async () => {
    parseBody.mockResolvedValue({
      isValidSignature: true,
      body: { _type: "project" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      revalidated: true,
      type: "project",
    });
    // "max" is stale-while-revalidate: the next visitor gets the cached page
    // while the fresh one loads behind them, so a publish never makes anyone
    // wait on Sanity.
    expect(revalidateTag).toHaveBeenCalledWith("sanity", "max");
  });

  it("verifies against the configured secret, not a hardcoded one", async () => {
    process.env["SANITY_REVALIDATE_SECRET"] = "a-different-secret";
    parseBody.mockResolvedValue({
      isValidSignature: true,
      body: { _type: "project" },
    });

    await POST(request);

    expect(parseBody).toHaveBeenCalledWith(request, "a-different-secret");
  });

  it("reports a parse failure as 500 rather than crashing the route", async () => {
    parseBody.mockRejectedValue(new Error("Malformed body"));

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "Malformed body",
    });
  });

  it("still answers when something non-Error is thrown", async () => {
    parseBody.mockRejectedValue("just a string");

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: "Unknown error.",
    });
  });
});
