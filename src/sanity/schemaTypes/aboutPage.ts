import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, titleWordsField } from "./shared";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    titleWordsField,
    imageField("portraitOne", "Portrait one"),
    defineField({
      name: "story",
      title: "Story paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 4 })],
    }),
  ],
});
