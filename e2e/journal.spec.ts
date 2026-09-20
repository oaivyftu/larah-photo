import {
  emptyJournalRenders,
  indexOpensPost,
  journalMarkedCurrent,
  postLeadsToContact,
} from "./journeys/journal";
import { underBothMotionPreferences } from "./support/variants";

underBothMotionPreferences("journal", {
  "a card on the index opens its post": indexOpensPost,
  "the end of a post leads on to the contact page": postLeadsToContact,
  "the journal is the current section on the index and on a post":
    journalMarkedCurrent,
  "an empty journal shows the editor's message": emptyJournalRenders,
});
