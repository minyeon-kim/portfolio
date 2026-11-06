"use client";

import { usePathname } from "next/navigation";
import { withBase } from "@/lib/site";
import { localeOf, ui } from "@/lib/i18n";

// The header's one page link (md+), once the resume exists. The projects and About
// are entered from the landing; phones keep the Menu (SiteMenu).
export function SiteNav({ resumeUrl }: { resumeUrl?: string }) {
  const t = ui[localeOf(usePathname() ?? "/")];
  if (!resumeUrl) return null;
  return (
    <nav aria-label={t.siteNav} className="site-nav">
      <ul>
        <li><a href={withBase(resumeUrl)}>{t.resume}</a></li>
      </ul>
    </nav>
  );
}
