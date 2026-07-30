import { defineType } from "sanity";
import { titleWordsField } from "./shared";

export const workPage = defineType({
  name: "workPage",
  title: "Work page",
  type: "document",
  fields: [titleWordsField],
  preview: {
    prepare: () => ({ title: "Work page" }),
  },
});
