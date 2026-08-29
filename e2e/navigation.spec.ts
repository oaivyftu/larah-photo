import {
  dismissProjectPreview,
  focusLandsInPageContent,
  followInternalLink,
} from "./journeys/navigation";
import { underBothMotionPreferences } from "./support/variants";

underBothMotionPreferences("navigation", {
  "a visitor follows an internal link and the page arrives": followInternalLink,
  "focus continues from within the new page's content": focusLandsInPageContent,
  "dismissing the project preview returns to the work index":
    dismissProjectPreview,
});
