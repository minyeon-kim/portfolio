import fs from "node:fs";
import path from "node:path";
import { HomeLink } from "@/components/home/case-panels";
import { site, withBase } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";
import { LangToggle } from "./lang-toggle";
import { GetInTouch, SiteNav } from "./site-nav";

// The name at the left edge; the two pages, the other language, theme and the
// one clear action (Get in touch) at the right. Phones fold the links into the Menu.
export async function SiteHeader() {
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <HeaderShell>
      <div className="site-header-bar grid min-h-[64px] grid-cols-[auto_1fr] items-center gap-2">
        <HomeLink className="header-name whitespace-nowrap">{site.name}</HomeLink>
        <div className="flex items-center justify-end gap-2">
          <SiteNav resumeUrl={hasResume ? site.resumeUrl : undefined} />
          <LangToggle />
          <ThemeToggle />
          <GetInTouch email={site.email} />
          <SiteMenu
            contact={{
              email: site.email,
              linkedinUrl: site.linkedinUrl,
              resumeUrl: hasResume ? site.resumeUrl : undefined,
            }}
          />
        </div>
      </div>
    </HeaderShell>
  );
}
