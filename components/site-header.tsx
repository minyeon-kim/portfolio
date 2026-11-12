import fs from "node:fs";
import path from "node:path";
import { HomeLink } from "@/components/home/case-panels";
import { getCases, type CaseEntry } from "@/lib/cases";
import { site } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";
import { LangToggle } from "./lang-toggle";
import { SiteNav } from "./site-nav";

const toMenu = (cases: CaseEntry[]) => cases.filter((c) => !c.meta.draft).map((c) => ({ slug: c.slug, name: c.meta.short ?? c.meta.title, poster: (c.meta.hero as { clip?: { poster: string } } | undefined)?.clip?.poster }));

// The name in the middle; language and theme at the right; Menu at the left on every
// page. Phones keep Menu at the right. Contact lives in the Menu and at the end of pages.
export async function SiteHeader() {
  const [en, ko] = await Promise.all([getCases("en"), getCases("ko")]);
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <HeaderShell>
      <div className="site-header-bar grid min-h-[64px] grid-cols-[auto_1fr_auto] items-center gap-2">
        <HomeLink className="header-name whitespace-nowrap">{site.name}</HomeLink>
        <div className="flex items-center justify-end gap-2">
          <SiteNav resumeUrl={hasResume ? site.resumeUrl : undefined} />
          <LangToggle />
          <ThemeToggle />
        </div>
        <SiteMenu
          contact={{
            email: site.email,
            linkedinUrl: site.linkedinUrl,
            resumeUrl: hasResume ? site.resumeUrl : undefined,
          }}
          cases={{ en: toMenu(en), ko: toMenu(ko) }}
        />
      </div>
    </HeaderShell>
  );
}
