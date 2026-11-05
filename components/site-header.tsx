import fs from "node:fs";
import path from "node:path";
import { HomeLink } from "@/components/home/case-panels";
import { getCases, type CaseEntry } from "@/lib/cases";
import { site } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";
import { LangToggle } from "./lang-toggle";
import { GetInTouch, SiteNav } from "./site-nav";

const toMenu = (cases: CaseEntry[]) => cases.filter((c) => !c.meta.draft).map((c) => ({ slug: c.slug, name: c.meta.short ?? c.meta.title }));

// The name in the middle; language, theme and the one clear action (Get in touch)
// at the right; Menu at the left on every page but the landing, whose left column
// already holds the same links. Phones keep Menu at the right, on every page.
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
          <GetInTouch email={site.email} />
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
