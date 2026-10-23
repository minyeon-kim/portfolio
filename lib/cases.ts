import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slug";
import type { Locale } from "./i18n";

const CASES_DIR = path.join(process.cwd(), "content/cases");
// Korean copies of each case live under content/ko/cases with the same slugs.
const casesDir = (locale: Locale) => (locale === "ko" ? path.join(process.cwd(), "content/ko/cases") : CASES_DIR);
const isProd = process.env.NODE_ENV === "production";

// Live demo shown in the case's section on the landing page.
export type CaseTeaser =
  | {
      type: "before-after";
      before: { src: string; alt: string };
      after: { src: string; alt: string };
      width: number;
      height: number;
      caption?: string;
    }
  | { type: "token-playground" };

export type CaseMeta = {
  title: string;
  short?: string; // compact name for the landing page index and section rail
  teaser?: CaseTeaser;
  role?: string; // short, for the meta row and home card
  timeline?: string;
  tools?: string[];
  keywords?: string[]; // shown as tags under the project name
  cover?: string; // path under /public, e.g. "/images/cases/<slug>/cover.webp" (1600x800 WebP)
  concept?: boolean; // self-initiated work, shown with a [CONCEPT] label
  featured?: boolean;
  draft?: boolean; // shown in dev only, never exported
  order?: number;
};

// The three lines inside the <TLDR> block every case study starts with.
export type Tldr = { problem: string; role: string; outcome: string };

export type CaseEntry = { slug: string; meta: CaseMeta; tldr: Tldr; decisions: TocItem[] };

export type TocItem = { id: string; label: string };

function readSource(slug: string, locale: Locale = "en") {
  return fs.readFileSync(path.join(casesDir(locale), `${slug}.mdx`), "utf8");
}

// Runs at build time only (static export), so reading the filesystem is fine.
export function getCaseSlugs(): string[] {
  return fs
    .readdirSync(CASES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
    .filter((slug) => !(isProd && /^\s*draft:\s*true/m.test(readSource(slug))));
}

// Reads `- **Problem:** ...` style lines from the <TLDR> block (Korean cases
// use 문제 / 역할 / 결과).
const TLDR_LABELS = { en: ["Problem", "My role", "Outcome"], ko: ["문제", "역할", "결과"] } as const;
function readTldr(source: string, locale: Locale = "en"): Tldr {
  const block = source.match(/<TLDR>([\s\S]*?)<\/TLDR>/)?.[1] ?? "";
  const line = (label: string) =>
    block
      .match(new RegExp(`\\*\\*${label}:\\*\\*(.*)$`, "m"))?.[1]
      .replace(/\{\/\*.*?\*\/\}/g, "") // drop MDX comments
      .trim() ?? "";
  const [problem, role, outcome] = TLDR_LABELS[locale];
  return { problem: line(problem), role: line(role), outcome: line(outcome) };
}

// Table of contents: the TL;DR box, then every `## ` heading in the body.
function readToc(source: string, locale: Locale = "en"): TocItem[] {
  const items: TocItem[] = source.includes("<TLDR>") ? [{ id: "tldr", label: locale === "ko" ? "한눈에 보기" : "At a glance" }] : [];
  for (const [, label] of source.matchAll(/^## (.+)$/gm)) {
    items.push({ id: slugify(label), label });
  }
  for (const [, id, label] of source.matchAll(/<CaseSection id="([^"]+)" label="([^"]+)"/g)) {
    items.push({ id, label: label.replace(/^\d+\s*\/\s*/, "") });
  }
  return items;
}

// The `### ` headings inside "## Decisions", used as jump links on the landing page.
function readDecisions(source: string): TocItem[] {
  const section = source.match(/<CaseSection id="decisions"[^>]*>([\s\S]*?)<\/CaseSection>/)?.[1]
    ?? source.split(/^## Decisions\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  return [...section.matchAll(/^### (.+)$/gm)].map(([, label]) => ({ id: slugify(label), label }));
}

export async function getCase(slug: string, locale: Locale = "en") {
  const mod = locale === "ko" ? await import(`@/content/ko/cases/${slug}.mdx`) : await import(`@/content/cases/${slug}.mdx`);
  const source = readSource(slug, locale);
  return {
    slug,
    meta: mod.meta as CaseMeta,
    tldr: readTldr(source, locale),
    toc: readToc(source, locale),
    decisions: readDecisions(source),
    Content: mod.default,
  };
}

export async function getCases(locale: Locale = "en"): Promise<CaseEntry[]> {
  const entries = await Promise.all(
    getCaseSlugs().map(async (slug) => {
      const { meta, tldr, decisions } = await getCase(slug, locale);
      return { slug, meta, tldr, decisions };
    }),
  );
  return entries.sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99));
}

// The case after this one in display order, wrapping to the first.
export async function getNextCase(slug: string, locale: Locale = "en"): Promise<CaseEntry | null> {
  const cases = (await getCases(locale)).filter((entry) => !entry.meta.draft);
  if (cases.length < 2) return null;
  const index = cases.findIndex((c) => c.slug === slug);
  return cases[(index + 1) % cases.length];
}

// Every other published case, starting after this one in display order (for
// "More work").
export async function getOtherCases(slug: string, locale: Locale = "en"): Promise<CaseEntry[]> {
  const cases = (await getCases(locale)).filter((entry) => !entry.meta.draft);
  const index = cases.findIndex((c) => c.slug === slug);
  return Array.from({ length: cases.length - 1 }, (_, k) => cases[(index + 1 + k) % cases.length]);
}
