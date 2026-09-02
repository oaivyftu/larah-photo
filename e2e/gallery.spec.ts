import {
  advanceWithControl,
  controlsRecedeWhenPointerIdles,
  dismissFullScreenInsidePreview,
  moveWithArrowKeys,
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
