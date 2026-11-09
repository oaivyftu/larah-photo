import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Touch gestures, which Playwright's API does not offer.
 *
 * `page.touchscreen` can tap and nothing else, and `page.mouse` is not a
 * substitute: the carousel binds touch events specifically (unidragger prefers
 * them wherever `ontouchstart` exists, so that it can cancel the browser's own
 * scrolling), and the failure this journey exists for -- a swipe lost to that
 * scrolling -- only happens on the touch path. So the events are dispatched
 * through CDP, which is the same mechanism Playwright's own touchscreen uses.
 */

/** The centre of an element, in viewport coordinates. */
async function centreOf(target: Locator) {
  const box = await target.boundingBox();

  expect(box, "the element to swipe on should be on screen").not.toBeNull();

  return {
    x: box!.x + box!.width / 2,
    y: box!.y + box!.height / 2,
  };
}

/**
 * Drag a finger horizontally across `target` and lift it.
 *
 * `verticalDrift` leans the swipe because a real one is never perfectly
 * horizontal. Be clear about what that buys here, though: the failure it
 * imitates -- the browser claiming a leaning gesture as a scroll of the panel
 * behind the lightbox, which cancelled the drag -- does not reproduce under
 * synthetic touch. The journey was run against the unfixed stylesheet and
 * passed. The drift is kept because it costs nothing and makes the gesture
 * honest, not because it guards that fix; that one is a device check.
 */
export async function swipeHorizontally(
  page: Page,
  target: Locator,
  {
    distance,
    verticalDrift = 15,
  }: { distance: number; verticalDrift?: number },
) {
  const start = await centreOf(target);
  const client = await page.context().newCDPSession(page);
  const steps = 8;

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y }],
  });

  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;

    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + distance * progress,
          y: start.y + verticalDrift * progress,
        },
      ],
    });
  }

  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await client.detach();
}

/**
 * Drag a finger down across `target` and lift it.
 *
 * `restBeforeLift` holds the finger still for that many milliseconds before it
 * lifts. The gesture under test reads the speed of the last few moments before
 * release -- a quick flick dismisses even when it is short -- and CDP delivers
 * the moves a millisecond or two apart, which is faster than any hand. A drag
 * meant to *not* count as a flick has to stop first, as a real one does.
 */
export async function swipeVertically(
  page: Page,
  target: Locator,
  {
    distance,
    horizontalDrift = 0,
    restBeforeLift = 0,
  }: { distance: number; horizontalDrift?: number; restBeforeLift?: number },
) {
  const start = await centreOf(target);
  const client = await page.context().newCDPSession(page);
  const steps = 10;

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y }],
  });

  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;

    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + horizontalDrift * progress,
          y: start.y + distance * progress,
        },
      ],
    });
  }

  if (restBeforeLift > 0) {
    await page.waitForTimeout(restBeforeLift);
  }

  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await client.detach();
}
