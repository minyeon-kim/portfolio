import fs from "node:fs";
import path from "node:path";
import { HomeLink } from "@/components/home/case-panels";
import { site, withBase } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";
import { LangToggle } from "./lang-toggle";
import { SiteNav } from "./site-nav";

// The name at the left edge; the page links, EN | KO and theme at the right
// edge. The links are always in view on md+; phones fold them into the Menu.
export async function SiteHeader() {
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <HeaderShell>
      {/*
        Controls sit at the screen edges (not the content width). After a little
        scroll (md+) they fold into one compact floating pill; inside it the
        buttons drop their own pill backgrounds, so there is never a pill in a pill.
      */}
      <div className="site-header-bar mx-auto grid max-w-full grid-cols-[auto_1fr] items-center gap-2 py-[18px] transition-[max-width,margin,padding,background-color,border-color] duration-400 ease-standard md:group-data-compact/header:my-1 md:group-data-compact/header:max-w-[720px] md:group-data-compact/header:rounded-full md:group-data-compact/header:bg-surface/70 md:group-data-compact/header:py-1 md:group-data-compact/header:backdrop-blur-md">
        <HomeLink className="header-name whitespace-nowrap">{site.name}</HomeLink>
        <div className="flex items-center justify-end gap-2">
          <SiteNav email={site.email} linkedinUrl={site.linkedinUrl} resumeUrl={hasResume ? site.resumeUrl : undefined} />
          <LangToggle />
          <ThemeToggle />
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
