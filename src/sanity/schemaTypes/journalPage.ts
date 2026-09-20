import { defineField, defineType } from "sanity";
import { titleWordsField } from "./shared";

/**
 * Journal settings: the listing heading, what the listing says when no post
 * is live, and the call to action at the end of every post (spec 013 FR-006).
 * All required — a missing one is a content error, never a default.
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
    defineField({
      name: "ctaHeading",
      title: "End of post: heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaBody",
      title: "End of post: text",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaContactLabel",
      title: "End of post: contact link text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaWorkLabel",
      title: "End of post: work link text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Journal page" }),
  },
});
