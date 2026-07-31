import { defineType } from "sanity";
import { titleWordsField } from "./shared";

export const servicePage = defineType({
  name: "servicePage",
  title: "Service page",
  type: "document",
  fields: [titleWordsField],
  preview: {
    prepare: () => ({ title: "Service page" }),
  },
});
