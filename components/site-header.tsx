import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { experiments } from "@/components/playground/experiments";
import { getCases } from "@/lib/cases";
import { nav, site } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";

// Menu on the left (opens the side menu), name in the middle, resume and
// theme on the right. Page links live in the menu.
export async function SiteHeader() {
  const cases = (await getCases()).filter((c) => !c.meta.draft);
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <HeaderShell>
      {/* Folds into a compact floating bar after a little scroll (md+). */}
      <div className="mx-auto grid max-w-page grid-cols-[1fr_auto_1fr] items-center gap-2 border border-transparent px-2 py-2 transition-[max-width,margin,padding,background-color,border-color] duration-400 ease-standard md:px-4 md:group-data-compact/header:my-1 md:group-data-compact/header:max-w-[760px] md:group-data-compact/header:rounded-md md:group-data-compact/header:border-line md:group-data-compact/header:bg-surface/90 md:group-data-compact/header:py-1 md:group-data-compact/header:backdrop-blur-sm">
        <div>
          <SiteMenu
            cases={cases.map(({ slug, meta, tldr }) => ({
              slug,
              name: meta.short ?? meta.title,
              problem: tldr.problem,
              role: meta.role,
              cover: meta.cover,
            }))}
            pages={nav}
            experiments={experiments.map((x) => x.title)}
            contact={{
              email: site.email,
              linkedinUrl: site.linkedinUrl,
              resumeUrl: hasResume ? site.resumeUrl : undefined,
            }}
          />
        </div>
        <Link href="/" className="text-sm font-medium whitespace-nowrap">
          {site.name}
        </Link>
        <div className="flex items-center justify-end gap-2">
          {/* TODO: add public/resume.pdf; the link appears once it exists. */}
          {hasResume && (
            <a href={site.resumeUrl} className="font-mono text-xs text-accent underline-offset-4 hover:underline">
              Resume
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </HeaderShell>
  );
}
