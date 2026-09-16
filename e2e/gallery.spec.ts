import { test } from "@playwright/test";
import {
  advanceWithControl,
  controlsRecedeWhenPointerIdles,
  dismissFullScreenInsidePreview,
  moveWithArrowKeys,
  swipeToNextPhotograph,
} from "./journeys/gallery";
import { underBothMotionPreferences } from "./support/variants";

underBothMotionPreferences("gallery", {
  "a visitor advances the gallery with the next control": advanceWithControl,
  "a visitor moves the gallery with the arrow keys": moveWithArrowKeys,
  "dismissing a full-screen photograph keeps the project preview open":
    dismissFullScreenInsidePreview,
  "the gallery controls recede when the pointer idles, and return":
    controlsRecedeWhenPointerIdles,
});

// The touch half of the gallery, which is a different carousel rather than the
// same one at a smaller size: a coarse pointer drags slides, a fine one
// crossfades. `test.use` inside a describe applies to the journeys nested under
// it, so the variant pair still runs under both motion preferences.
//
// The context options are spelled out rather than taken from `devices[...]`:
// those descriptors carry a `defaultBrowserType`, which Playwright rejects as a
// per-describe option.
test.describe("on a touch device", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  underBothMotionPreferences("gallery", {
    "a visitor swipes to the next photograph": swipeToNextPhotograph,
  });
});
