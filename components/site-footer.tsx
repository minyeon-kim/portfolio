"use client";

import Link from "next/link";
import { localize } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useLocale, useStrings } from "@/lib/use-locale";

// Closing block at the end of case studies and the playground: one line and a
// way onward. It replaces the old site-wide footer, whose Email and LinkedIn
// links it already carries. About has its own Contact section, so it skips this.
export function SiteFooter() {
  const t = useStrings();
  const locale = useLocale();
  return (
    <footer className="site-closing">
      <p className="site-closing-title">{t.closingTitle}</p>
      <ul className="site-closing-links">
        <li><Link href={localize("/about/", locale)} className="site-closing-pill">{t.about} <span aria-hidden="true">→</span></Link></li>
        {site.email && <li><a href={`mailto:${site.email}`} className="site-closing-pill">{t.email}</a></li>}
        {site.linkedinUrl && <li><a href={site.linkedinUrl} className="site-closing-pill">{t.linkedin}</a></li>}
      </ul>
    </footer>
  );
}
