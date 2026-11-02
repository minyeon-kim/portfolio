// One root layout serves both languages, so every exported page starts as
// lang="en". The Korean pages get the right value here, for crawlers and for
// browsers' translate prompts, which read it before any script runs.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "out", "ko");
const entries = await readdir(root, { recursive: true });
const pages = entries.filter((entry) => entry.endsWith(".html"));
for (const page of pages) {
  const file = path.join(root, page);
  const html = await readFile(file, "utf8");
  await writeFile(file, html.replace('<html lang="en"', '<html lang="ko"'));
}
console.log(`set lang="ko" on ${pages.length} pages`);
