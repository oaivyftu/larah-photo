import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    defineField({
      name: "heroTagline",
      title: "Hero tagline",
      description:
        "Sits beside the hero portrait. Rendered uppercase; each word animates in on its own.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    imageField("heroPortraitImage", "Hero portrait image (3:4)"),
    imageField("heroImage", "Hero feature image (3:2)"),
    defineField({
      name: "heroBrandmark",
      title: "Hero brandmark",
      description:
        "Word laid across the left edge of the hero feature image. Rendered uppercase.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroCtaLabel",
      title: "Hero link label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroCtaHref",
      title: "Hero link target",
      description: 'A site path such as "/work", or a full external URL.',
      type: "string",
      validation: (rule) => rule.required(),
    }),
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
  ],
  preview: {
    prepare: () => ({ title: "Home page" }),
  },
});
