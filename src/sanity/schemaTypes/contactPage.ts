import { defineField, defineType } from "sanity";
import { imageField, titleWordsField } from "./shared";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    titleWordsField,
    defineField({ name: "largeText", title: "Large pinned text", type: "string" }),
    defineField({
      name: "fastestRouteLabel",
      title: "Fastest route label",
      type: "string",
    }),
    defineField({
      name: "fastestRouteTitle",
      title: "Fastest route title",
      type: "string",
    }),
    defineField({ name: "locationLabel", title: "Location label", type: "string" }),
    defineField({ name: "locationTitle", title: "Location title", type: "string" }),
    defineField({
      name: "locationDescription",
      title: "Location description",
      type: "text",
      rows: 3,
    }),
    imageField("image", "Contact image"),
    defineField({ name: "formEyebrow", title: "Form eyebrow", type: "string" }),
    defineField({ name: "formTitle", title: "Form title", type: "string" }),
    defineField({ name: "formCopy", title: "Form copy", type: "text", rows: 3 }),
  ],
});
