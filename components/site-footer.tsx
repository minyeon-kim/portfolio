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
  // Our own eased scroll, not behavior: "smooth": on a case opened from the
  // landing something cancels the browser's smooth scroll after one step and the
  // button seemed to do nothing. A wheel or touch stops it.
  const toTop = () => {
    const from = window.scrollY;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from < 2) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const duration = Math.min(1200, 500 + from / 60);
    const start = performance.now();
    let frame = 0;
    const stop = () => { cancelAnimationFrame(frame); window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo({ top: Math.round(from * (1 - e)), behavior: "instant" });
      if (t < 1) frame = requestAnimationFrame(step); else stop();
    };
    frame = requestAnimationFrame(step);
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
          <li><Link href={localize("/playground/", locale)}>{t.playground}</Link></li>
          {site.email && <li><a href={`mailto:${site.email}`}>{t.email}</a></li>}
          {site.linkedinUrl && <li><a href={site.linkedinUrl}>LinkedIn</a></li>}
        </ul>
        <button type="button" onClick={toTop} className="site-footer-top-link">{t.backToTop} <span aria-hidden="true">↑</span></button>
      </div>
    </footer>
  );
}
