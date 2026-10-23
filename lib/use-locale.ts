import { usePathname } from "next/navigation";
import { localeOf, ui, type Locale } from "./i18n";

// Client components read the locale from the URL (/ko/... is Korean).
export function useLocale(): Locale {
  return localeOf(usePathname() ?? "/");
}

export function useStrings() {
  return ui[useLocale()];
}
