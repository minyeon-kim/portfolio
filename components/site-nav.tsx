"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBase } from "@/lib/site";
import { HomeLink } from "@/components/home/case-panels";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

// The page links, always in view at the top (md+): there are only a few, so
// they don't hide behind a Menu button. Phones keep the Menu (SiteMenu).
type Props = { email: string; linkedinUrl: string; resumeUrl?: string };

export function SiteNav({ email, linkedinUrl, resumeUrl }: Props) {
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
        {linkedinUrl && <li><a href={linkedinUrl}>LinkedIn<span aria-hidden="true"> ↗</span></a></li>}
        {email && <li><a href={`mailto:${email}`}>{t.email}<span aria-hidden="true"> ↗</span></a></li>}
      </ul>
    </nav>
  );
}
