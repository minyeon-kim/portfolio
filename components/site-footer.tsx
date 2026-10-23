import Link from "next/link";
import { site } from "@/lib/site";

// Closing block at the end of case studies and the playground: one line and a
// way onward. It replaces the old site-wide footer, whose Email and LinkedIn
// links it already carries. About has its own Contact section, so it skips this.
export function SiteFooter() {
  return (
    <footer className="site-closing">
      <p className="site-closing-title">More about how I work</p>
      <ul className="site-closing-links">
        <li><Link href="/about/" className="site-closing-pill">About <span aria-hidden="true">→</span></Link></li>
        {site.email && <li><a href={`mailto:${site.email}`} className="site-closing-pill">Email</a></li>}
        {site.linkedinUrl && <li><a href={site.linkedinUrl} className="site-closing-pill">LinkedIn</a></li>}
      </ul>
    </footer>
  );
}
