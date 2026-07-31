import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

const spanOptions = [
  { title: "Full", value: "full" },
  ...Array.from({ length: 12 }, (_, index) => ({
    title: String(index + 1),
    value: String(index + 1),
  })),
];

export const workProject = defineType({
  name: "workProject",
  title: "Work project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "meta", title: "Card meta", type: "string" }),
    defineField({ name: "category", title: "Category", type: "string" }),
    defineField({ name: "year", title: "Year", type: "string" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    imageField("cardImage", "Card image"),
    defineField({ name: "featured", title: "Featured", type: "boolean" }),
    defineField({ name: "featuredOrder", title: "Featured order", type: "number" }),
    defineField({
      name: "homepageSpan",
      title: "Homepage span",
      type: "string",
      options: { list: spanOptions },
    }),
    defineField({
      name: "images",
      title: "Gallery images",
      description:
        "Drag and drop multiple image files here to upload the whole gallery at once.",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "meta",
      media: "cardImage",
    },
  },
});
