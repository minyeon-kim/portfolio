import fs from "node:fs";
import path from "node:path";

const CASES_DIR = path.join(process.cwd(), "content/cases");

export type CaseMeta = {
  title: string;
  summary: string;
  role?: string;
  year?: string;
  concept?: boolean; // self-initiated work, shown with a [CONCEPT] label
  featured?: boolean;
  order?: number;
};

export type CaseEntry = { slug: string; meta: CaseMeta };

// Runs at build time only (static export), so reading the filesystem is fine.
export function getCaseSlugs(): string[] {
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export async function getCase(slug: string) {
  const mod = await import(`@/content/cases/${slug}.mdx`);
  return { slug, meta: mod.meta as CaseMeta, Content: mod.default };
}

export async function getCases(): Promise<CaseEntry[]> {
  const entries = await Promise.all(
    getCaseSlugs().map(async (slug) => {
      const { meta } = await getCase(slug);
      return { slug, meta };
    }),
  );
  return entries.sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99));
}
