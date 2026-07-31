import { at, defineMigration, set } from "sanity/migrate";

type GalleryItem = Record<string, unknown> & {
  _key?: string;
  image?: Record<string, unknown>;
};

function isGalleryItem(value: unknown): value is GalleryItem {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default defineMigration({
  title: "Flatten legacy work project gallery images",
  documentTypes: ["workProject"],
  filter: "defined(images[].image)",

  migrate: {
    document(document) {
      if (!Array.isArray(document.images)) {
        return;
      }

      const images = document.images.map((item) => {
        if (!isGalleryItem(item) || !isGalleryItem(item.image)) {
          return item;
        }

        return {
          ...item.image,
          _key: item._key ?? item.image._key,
          _type: "image",
        };
      });

      return at("images", set(images));
    },
  },
});
