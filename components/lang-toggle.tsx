"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

// EN | KO beside the theme toggle: two round faces in one pill, with a filled
// round knob that slides behind the current language. Each face links to the
// same page in the other language.
export function LangToggle() {
  const pathname = usePathname() ?? "/";
  const locale = localeOf(pathname);
  const page = stripLocale(pathname);
  const t = ui[locale];
  return (
    <nav aria-label={t.languageLabel} className="lang-toggle" data-active={locale}>
      <span className="lang-toggle-knob" aria-hidden="true" />
      {(["en", "ko"] as const).map((code) => (
        <Link key={code} href={localize(page, code)} hrefLang={code} lang={code} aria-current={locale === code ? "page" : undefined} className="press lang-toggle-option">
          {code === "en" ? "EN" : "KO"}
        </Link>
      ))}
    </nav>
  );
}
