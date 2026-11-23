import { defineField, defineType } from "sanity";
import { titleWordsField } from "./shared";

/**
 * Journal settings: the listing heading and what the listing says when no post
 * is live (spec 013 FR-006). Both required — a missing one is a content error,
 * never a default.
 */
export const journalPage = defineType({
  name: "journalPage",
  title: "Journal page",
  type: "document",
  fields: [
    titleWordsField,
    defineField({
      name: "emptyStateMessage",
      title: "Message when there are no posts",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Journal page" }),
  },
});
