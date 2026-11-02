"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

// The other language, as one quiet link to the same page in that language.
export function LangToggle() {
  const pathname = usePathname() ?? "/";
  const locale = localeOf(pathname);
  const other = locale === "en" ? "ko" : "en";
  return (
    <Link href={localize(stripLocale(pathname), other)} hrefLang={other} lang={other} aria-label={ui[locale].languageLabel} className="lang-link">
      {other === "en" ? "EN" : "KO"}
    </Link>
  );
}
