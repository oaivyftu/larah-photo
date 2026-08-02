import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { SANITY_CACHE_TAG } from "@/sanity/fetchers";

/**
 * Sanity webhook target: publishing in the Studio busts the cached queries so
 * the change is live in seconds, instead of waiting out the hourly
 * `revalidate` the fetchers fall back on.
 *
 * Setup: in Sanity manage → API → Webhooks, POST to `/api/revalidate` with the
 * same secret as `SANITY_REVALIDATE_SECRET`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET is not configured." },
      { status: 500 },
    );
  }

  try {
    // `parseBody` also waits out Content Lake's eventual consistency, so the
    // revalidated queries read the new document rather than the old one.
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(
      request,
      secret,
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { message: "Invalid signature." },
        { status: 401 },
      );
    }

    if (!body?._type) {
      return NextResponse.json(
        { message: "Payload is missing a document type." },
        { status: 400 },
      );
    }

    // `"max"` gives stale-while-revalidate: the next visitor is served the
    // cached page while the fresh one is fetched behind them, so a publish
    // never makes anyone wait on Sanity. `updateTag` would expire it outright
    // but is Server Actions only, which a webhook is not.
    revalidateTag(SANITY_CACHE_TAG, "max");

    return NextResponse.json({ revalidated: true, type: body._type });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 },
    );
  }
}
