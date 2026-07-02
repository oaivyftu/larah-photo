import { defineField, defineType } from "sanity";
import { titleWordsField } from "./shared";

export const workPage = defineType({
  name: "workPage",
  title: "Work page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
    }),
    titleWordsField,
    defineField({
      name: "indexLabel",
      title: "Index label",
      type: "string",
      initialValue: "Index",
    }),
  ],
});
