import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slug";

const CASES_DIR = path.join(process.cwd(), "content/cases");
const isProd = process.env.NODE_ENV === "production";

export type CaseMeta = {
  title: string;
  role?: string; // short, for the meta row and home card
  timeline?: string;
  tools?: string[];
  cover?: string; // path under /public, e.g. "/images/cases/<slug>/cover.webp" (1600x800 WebP)
  concept?: boolean; // self-initiated work, shown with a [CONCEPT] label
  featured?: boolean;
  draft?: boolean; // shown in dev only, never exported
  order?: number;
};

// The three lines inside the <TLDR> block every case study starts with.
export type Tldr = { problem: string; role: string; outcome: string };

export type CaseEntry = { slug: string; meta: CaseMeta; tldr: Tldr };

export type TocItem = { id: string; label: string };

function readSource(slug: string) {
  return fs.readFileSync(path.join(CASES_DIR, `${slug}.mdx`), "utf8");
}

// Runs at build time only (static export), so reading the filesystem is fine.
export function getCaseSlugs(): string[] {
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
    .filter((slug) => !(isProd && /^\s*draft:\s*true/m.test(readSource(slug))));
}

// Reads `- **Problem:** ...` style lines from the <TLDR> block.
function readTldr(source: string): Tldr {
  const block = source.match(/<TLDR>([\s\S]*?)<\/TLDR>/)?.[1] ?? "";
  const line = (label: string) =>
    block
      .match(new RegExp(`\\*\\*${label}:\\*\\*(.*)$`, "m"))?.[1]
      .replace(/\{\/\*.*?\*\/\}/g, "") // drop MDX comments
      .trim() ?? "";
  return { problem: line("Problem"), role: line("My role"), outcome: line("Outcome") };
}

// Table of contents: the TL;DR box, then every `## ` heading in the body.
function readToc(source: string): TocItem[] {
  const items: TocItem[] = source.includes("<TLDR>") ? [{ id: "tldr", label: "TL;DR" }] : [];
  for (const [, label] of source.matchAll(/^## (.+)$/gm)) {
    items.push({ id: slugify(label), label });
  }
  return items;
}

export async function getCase(slug: string) {
  const mod = await import(`@/content/cases/${slug}.mdx`);
  const source = readSource(slug);
  return {
    slug,
    meta: mod.meta as CaseMeta,
    tldr: readTldr(source),
    toc: readToc(source),
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

// The case after this one in display order, wrapping to the first.
export async function getNextCase(slug: string): Promise<CaseEntry | null> {
  const cases = await getCases();
  if (cases.length < 2) return null;
  const index = cases.findIndex((c) => c.slug === slug);
  return cases[(index + 1) % cases.length];
}
