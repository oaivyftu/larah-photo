import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, titleWordsField } from "./shared";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    titleWordsField,
    defineField({ name: "largeText", title: "Large pinned text", type: "string" }),
    imageField("portraitOne", "Portrait one"),
    imageField("portraitTwo", "Portrait two"),
    defineField({
      name: "notes",
      title: "Notes",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "story",
      title: "Story paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 4 })],
    }),
  ],
});
