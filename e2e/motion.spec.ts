import { test } from "@playwright/test";
import {
  pageArrivesWithoutAnimation,
  pageEntryAnimationCompletes,
  pointerLabelAppears,
} from "./journeys/motion";
import { underBothMotionPreferences } from "./support/variants";

// J9 takes the shared wrapper: same journey, same ending, two preferences.
underBothMotionPreferences("pointer label", {
  "hovering a labelled target shows the label": pointerLabelAppears,
});

// J8 does not. Its whole point is that the two preferences end differently, so
// the two endings are written out rather than shared -- the one place in this
// suite where a copy is the honest thing to write.
test.describe("page entry", () => {
  test("the entrance animation runs and completes", ({ page }) =>
    pageEntryAnimationCompletes(page));
});

test.describe("page entry under reduce", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the page arrives without an entrance animation", ({ page }) =>
    pageArrivesWithoutAnimation(page));
});
