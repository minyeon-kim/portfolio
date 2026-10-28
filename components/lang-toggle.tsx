"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

// EN | KO as one small segmented pill beside the theme toggle. Each segment
// links to the same page in that language; the current one is marked.
export function LangToggle() {
  const pathname = usePathname() ?? "/";
  const locale = localeOf(pathname);
  const page = stripLocale(pathname);
  const t = ui[locale];
  return (
    <nav aria-label={t.languageLabel} className="lang-toggle">
      {(["en", "ko"] as const).map((code) => (
        <Link key={code} href={localize(page, code)} hrefLang={code} lang={code} aria-current={locale === code ? "page" : undefined} className="press lang-toggle-option">
          {code === "en" ? "EN" : "KO"}
        </Link>
      ))}
    </nav>
  );
}
