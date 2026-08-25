import { defineArrayMember, defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Site name",
      type: "string",
      initialValue: "Larah Photo",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "email",
      title: "Business email",
      type: "email",
    }),
    defineField({
      name: "phone",
      title: "Business phone",
      type: "string",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "priceCurrency",
      title: "Price currency",
      description:
        "Three-letter ISO code for the currency the package prices are in " +
        '(e.g. "CAD", "USD"). The site renders prices with a bare "$", so ' +
        "this is what tells search engines which dollar is meant.",
      type: "string",
      initialValue: "CAD",
      validation: (rule) =>
        rule
          .uppercase()
          .length(3)
          .error("Use a three-letter ISO 4217 code, e.g. CAD."),
    }),
    defineField({
      name: "postalAddress",
      title: "Postal address",
      description:
        "Optional, and never shown on the site. Google only treats the studio " +
        "as a local business — the listing with a map, hours and directions — " +
        "when it can read a real street address, so filling this in is what " +
        "turns on local search results.",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "streetAddress", title: "Street", type: "string" }),
        defineField({ name: "locality", title: "City", type: "string" }),
        defineField({
          name: "region",
          title: "State / region",
          type: "string",
        }),
        defineField({
          name: "postalCode",
          title: "Postal code",
          type: "string",
        }),
        defineField({
          name: "country",
          title: "Country code",
          description: 'Two letters, e.g. "VN" or "US".',
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "footerStatement",
      title: "Footer statement",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "navigationItems",
      title: "Primary navigation",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "Path",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "href",
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
