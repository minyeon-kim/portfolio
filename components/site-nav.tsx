"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBase } from "@/lib/site";
import { HomeLink } from "@/components/home/case-panels";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

// The page links, always in view at the top (md+): there are only a few, so
// they don't hide behind a Menu button. Phones keep the Menu (SiteMenu).
export function SiteNav({ resumeUrl }: { resumeUrl?: string }) {
  const pathname = usePathname() ?? "/";
  const locale = localeOf(pathname);
  const page = stripLocale(pathname);
  const t = ui[locale];
  const current = (match: boolean) => (match ? ("page" as const) : undefined);
  return (
    <nav aria-label={t.siteNav} className="site-nav">
      <ul>
        <li aria-current={current(page === "/" || page.startsWith("/work/"))}><HomeLink>{t.work}</HomeLink></li>
        <li><Link href={localize("/about/", locale)} aria-current={current(page.startsWith("/about"))}>{t.about}</Link></li>
        {resumeUrl && <li><a href={withBase(resumeUrl)}>{t.resume}</a></li>}
      </ul>
    </nav>
  );
}

// The header's one filled button (md+): the thing a visitor is most likely here to do.
export function GetInTouch({ email }: { email: string }) {
  const locale = localeOf(usePathname() ?? "/");
  return <a href={`mailto:${email}`} className="header-cta press">{ui[locale].getInTouch}</a>;
}
