import { defineType } from "sanity";
import { titleWordsField } from "./shared";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  fields: [titleWordsField],
  preview: {
    prepare: () => ({ title: "Contact page" }),
  },
});
