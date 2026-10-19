import fs from "node:fs";
import path from "node:path";

const CASES_DIR = path.join(process.cwd(), "content/cases");

export type CaseMeta = {
  title: string;
  year?: string;
  cover?: string; // path under /public, e.g. "/images/cases/<slug>/cover.webp" (1600x900 WebP)
  concept?: boolean; // self-initiated work, shown with a [CONCEPT] label
  featured?: boolean;
  order?: number;
};

// The three TL;DR lines every case study starts with.
export type Tldr = { problem: string; role: string; outcome: string };

export type CaseEntry = { slug: string; meta: CaseMeta; tldr: Tldr };

// Runs at build time only (static export), so reading the filesystem is fine.
export function getCaseSlugs(): string[] {
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

// Reads `- **Problem:** ...` style lines from the "## TL;DR" section.
function readTldr(slug: string): Tldr {
  const source = fs.readFileSync(path.join(CASES_DIR, `${slug}.mdx`), "utf8");
  const section = source.split(/^## TL;DR\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  const line = (label: string) =>
    section
      .match(new RegExp(`\\*\\*${label}:\\*\\*(.*)$`, "m"))?.[1]
      .replace(/\{\/\*.*?\*\/\}/g, "") // drop MDX comments
      .trim() ?? "";
  return { problem: line("Problem"), role: line("My role"), outcome: line("Outcome") };
}

export async function getCase(slug: string) {
  const mod = await import(`@/content/cases/${slug}.mdx`);
  return {
    slug,
    meta: mod.meta as CaseMeta,
    tldr: readTldr(slug),
    Content: mod.default,
  };
}

export async function getCases(): Promise<CaseEntry[]> {
  const entries = await Promise.all(
    getCaseSlugs().map(async (slug) => {
      const { meta, tldr } = await getCase(slug);
      return { slug, meta, tldr };
    }),
  );
  return entries.sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99));
}
