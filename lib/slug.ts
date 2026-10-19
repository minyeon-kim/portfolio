// Heading text -> anchor id. Shared by the MDX h2 renderer and the TOC.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
