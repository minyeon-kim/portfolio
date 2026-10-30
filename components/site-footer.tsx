"use client";

import Link from "next/link";
import { localize } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useLocale, useStrings } from "@/lib/use-locale";

// Closing footer at the end of case studies and the playground, after
// metalab.com's: one big question, a short list of large ways onward (email,
// about, LinkedIn), then a quiet bottom row with the copyright, the page links
// and Back to top. About has its own Contact section, so it skips this.
export function SiteFooter() {
  const t = useStrings();
  const locale = useLocale();
  const year = new Date().getFullYear();
  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  };
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <p className="site-footer-headline">{t.footerHeadline}</p>
        <ul className="site-footer-actions">
          {site.email && <li><a href={`mailto:${site.email}`} className="site-footer-action">{t.footerEmail} <span aria-hidden="true">→</span></a></li>}
          <li><Link href={localize("/about/", locale)} className="site-footer-action">{t.footerAbout} <span aria-hidden="true">→</span></Link></li>
          {site.linkedinUrl && <li><a href={site.linkedinUrl} className="site-footer-action">LinkedIn <span aria-hidden="true">↗</span></a></li>}
        </ul>
      </div>
      <div className="site-footer-bottom">
        <span>© {year} {site.name}</span>
        <ul className="site-footer-meta">
          <li><Link href={localize("/", locale)}>{t.work}</Link></li>
          <li><Link href={localize("/about/", locale)}>{t.about}</Link></li>
          {site.email && <li><a href={`mailto:${site.email}`}>{t.email}</a></li>}
          {site.linkedinUrl && <li><a href={site.linkedinUrl}>LinkedIn</a></li>}
        </ul>
        <button type="button" onClick={toTop} className="site-footer-top-link">{t.backToTop} <span aria-hidden="true">↑</span></button>
      </div>
    </footer>
  );
}
