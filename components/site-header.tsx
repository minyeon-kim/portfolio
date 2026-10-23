import fs from "node:fs";
import path from "node:path";
import { HomeLink } from "@/components/home/case-panels";
import { site, withBase } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { SiteMenu } from "./site-menu";
import { ThemeToggle } from "./theme-toggle";

// Menu at the left edge, name in the center, resume and theme at the right
// edge (Metalab-style). Page links live in the menu.
export async function SiteHeader() {
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <HeaderShell>
      {/*
        Controls sit at the screen edges (not the content width). After a little
        scroll (md+) they fold into one compact floating pill; inside it the
        buttons drop their own pill backgrounds, so there is never a pill in a pill.
      */}
      <div className="site-header-bar mx-auto grid max-w-full grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 transition-[max-width,margin,padding,background-color,border-color] duration-400 ease-standard md:group-data-compact/header:my-1 md:group-data-compact/header:max-w-[360px] md:group-data-compact/header:rounded-full md:group-data-compact/header:bg-surface/70 md:group-data-compact/header:py-1 md:group-data-compact/header:backdrop-blur-md">
        <div>
          <SiteMenu
            contact={{
              email: site.email,
              linkedinUrl: site.linkedinUrl,
              resumeUrl: hasResume ? site.resumeUrl : undefined,
            }}
          />
        </div>
        <HomeLink className="header-name whitespace-nowrap">{site.name}</HomeLink>
        <div className="flex items-center justify-end gap-2">
          {/* TODO: add public/resume.pdf; the link appears once it exists. */}
          {hasResume && (
            <a href={withBase(site.resumeUrl)} className="link font-mono text-xs text-accent">
              Resume
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </HeaderShell>
  );
}
