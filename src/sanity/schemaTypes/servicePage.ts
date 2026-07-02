import { defineField, defineType } from "sanity";
import { imageField, titleWordsField } from "./shared";

export const servicePage = defineType({
  name: "servicePage",
  title: "Service page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    titleWordsField,
    imageField("image", "Bottom image"),
    defineField({
      name: "imageCopy",
      title: "Bottom image copy",
      type: "text",
      rows: 3,
    }),
  ],
});
