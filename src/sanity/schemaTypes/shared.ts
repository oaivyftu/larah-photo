import { defineArrayMember, defineField } from "sanity";

export const imageField = (name: string, title: string) =>
  defineField({
    name,
    title,
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
  });

export const titleWordsField = defineField({
  name: "titleWords",
  title: "Title words",
  description: "Each item renders as one animated word.",
  type: "array",
  of: [defineArrayMember({ type: "string" })],
  validation: (rule) => rule.required().min(1),
});
