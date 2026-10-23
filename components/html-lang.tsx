"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/use-locale";

// The root layout is shared by both languages, so the document language is
// set from the URL once the page runs.
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
