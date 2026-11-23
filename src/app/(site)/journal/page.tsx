import type { Metadata } from "next";
import { journalIndexMetadata, journalIndexView } from "./journalIndex";

/** Page 1 of the listing. Later pages are `/journal/page/<n>` (spec 013 FR-016a). */
export async function generateMetadata(): Promise<Metadata> {
  return journalIndexMetadata(1);
}

export default async function JournalPage() {
  return journalIndexView(1);
}
