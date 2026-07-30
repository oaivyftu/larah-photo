import { at, defineMigration, unset, type NodePatch } from "sanity/migrate";

const unusedFieldsByDocumentType: Record<string, readonly string[]> = {
  aboutPage: ["eyebrow", "largeText", "portraitTwo", "notes"],
  contactPage: [
    "eyebrow",
    "largeText",
    "fastestRouteLabel",
    "fastestRouteTitle",
    "locationLabel",
    "locationTitle",
    "locationDescription",
    "image",
    "formEyebrow",
    "formTitle",
  ],
  homePage: ["servicesTitle"],
  servicePage: ["eyebrow", "image", "imageCopy"],
  workPage: ["eyebrow", "indexLabel"],
  workProject: ["tags", "clientSubject"],
};

export default defineMigration({
  title: "Remove fields unused by the Larah Photo application",
  documentTypes: Object.keys(unusedFieldsByDocumentType),

  migrate: {
    document(document) {
      const patches: NodePatch[] = [];
      const fields = unusedFieldsByDocumentType[document._type] ?? [];

      for (const field of fields) {
        if (field in document) {
          patches.push(at(field, unset()));
        }
      }

      if (document._type === "workProject" && Array.isArray(document.images)) {
        document.images.forEach((item, index) => {
          if (!item || typeof item !== "object" || !("layout" in item)) {
            return;
          }

          const segment =
            "_key" in item && typeof item._key === "string"
              ? { _key: item._key }
              : index;

          patches.push(at(["images", segment, "layout"], unset()));
        });
      }

      return patches;
    },
  },
});
