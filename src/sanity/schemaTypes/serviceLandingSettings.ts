import { defineField, defineType } from "sanity";
// Relative rather than `@/`: the Sanity CLI bundler does not read the alias.
import { headingPatternIsValid } from "./landingValidation";

/**
 * The wording shared by every service landing page: the heading pattern, the
 * section headings and the call to action (spec 014 FR-008, FR-043). All
 * required — a missing one is a content error, never a default.
 */
export const serviceLandingSettings = defineType({
  name: "serviceLandingSettings",
  title: "Service landing settings",
  type: "document",
  fields: [
    defineField({
      name: "headingPattern",
      title: "Heading pattern",
      description:
        "e.g. {service} Photographer in {city}. {service} becomes the " +
        "page's service name (and alternate name); {city} becomes the " +
        "studio's location from the site settings.",
      type: "string",
      validation: (rule) => [
        rule.required(),
        rule.custom(headingPatternIsValid),
      ],
    }),
    defineField({
      name: "projectsHeading",
      title: "Projects heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "packageHeading",
      title: "Package heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "packageBookLabel",
      title: "Package booking label",
      description:
        "The text of the package block's booking button. The link itself " +
        "is the package's own.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "faqHeading",
      title: "Questions heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaHeading",
      title: "Call to action: heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaBody",
      title: "Call to action: text",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaContactLabel",
      title: "Call to action: contact link text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Service landing settings" }),
  },
});
