import { test } from "@playwright/test";
import {
  pageArrivesWithoutAnimation,
  pageEntryAnimationCompletes,
  pointerLabelAppears,
  pointerLabelAppearsWithoutTrailing,
} from "./journeys/motion";

// J8 and J9 both write their two endings out rather than sharing a body
// through `underBothMotionPreferences`: for both, the whole point is that the
// two preferences end differently. J9 first shipped inside the shared
// wrapper, checking only that the label appeared under both -- which a
// `GlassPointer` regression that ignored `prefers-reduced-motion` entirely
// would still have passed.
test.describe("page entry", () => {
  test("the entrance animation runs and completes", ({ page }) =>
    pageEntryAnimationCompletes(page));
});

test.describe("page entry under reduce", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the page arrives without an entrance animation", ({ page }) =>
    pageArrivesWithoutAnimation(page));
});

test.describe("pointer label", () => {
  test("hovering a labelled target shows the label", ({ page }) =>
    pointerLabelAppears(page));
});

test.describe("pointer label under reduce", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the label appears with no trailing catch-up frame", ({ page }) =>
    pointerLabelAppearsWithoutTrailing(page));
});
