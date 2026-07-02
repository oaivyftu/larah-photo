import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

export const servicePackage = defineType({
  name: "servicePackage",
  title: "Service package",
  type: "document",
  fields: [
    defineField({ name: "id", title: "Internal ID", type: "string" }),
    defineField({ name: "index", title: "Display index", type: "string" }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "price", title: "Starting price", type: "number" }),
    imageField("image", "Package image"),
    defineField({
      name: "ctaHref",
      title: "CTA link",
      type: "string",
      initialValue: "/contact",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "index",
      media: "image",
    },
  },
});
