import { defineField, defineType } from "sanity";
import { titleWordsField } from "./shared";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  fields: [
    titleWordsField,
    defineField({ name: "formCopy", title: "Form copy", type: "text", rows: 3 }),
  ],
  preview: {
    prepare: () => ({ title: "Contact page" }),
  },
});
