export function normalizeWorkCategory(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

export function formatWorkCategory(category: string) {
  return normalizeWorkCategory(category)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
