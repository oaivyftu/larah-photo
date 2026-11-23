import {
  emptyJournalRenders,
  indexOpensPost,
  journalMarkedCurrent,
  pageBeyondTheEndIsNotFound,
  pageOneHasOneAddress,
  pagerWalksTheListing,
} from "./journeys/journal";
import { underBothMotionPreferences } from "./support/variants";

underBothMotionPreferences("journal", {
  "a card on the index opens its post": indexOpensPost,
  "the journal is the current section on the index and on a post":
    journalMarkedCurrent,
  "an empty journal shows the editor's message": emptyJournalRenders,
  "the pager walks to the next page and back": pagerWalksTheListing,
  "page 1 of the listing has one address": pageOneHasOneAddress,
  "a page past the end is not found": pageBeyondTheEndIsNotFound,
});
