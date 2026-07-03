import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField, titleWordsField } from "./shared";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Hero eyebrow", type: "string" }),
    titleWordsField,
    imageField("heroImage", "Hero image override"),
    defineField({
      name: "manifestoWords",
      title: "Manifesto words",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.length(3),
    }),
    imageField("manifestoImageOne", "Manifesto image one"),
    imageField("manifestoImageTwo", "Manifesto image two"),
    defineField({
      name: "selectedWorkEyebrow",
      title: "Selected work eyebrow",
      type: "string",
    }),
    defineField({
      name: "servicesEyebrow",
      title: "Services eyebrow",
      type: "string",
    }),
    defineField({
      name: "servicesTitle",
      title: "Services title",
      type: "string",
    }),
    imageField("closingImage", "Closing image"),
    defineField({
      name: "closingTitle",
      title: "Closing title",
      type: "string",
    }),
  ],
});
