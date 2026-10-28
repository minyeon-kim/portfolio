"use client";

import { type UiKey, ui } from "@/lib/i18n";
import { useStrings } from "@/lib/use-locale";

// Only the plain-string entries; lists and objects are read directly.
type StringKey = { [K in UiKey]: (typeof ui)["en"][K] extends string ? K : never }[UiKey];

// A UI string in the page's language, for server components and MDX.
export function T({ k }: { k: StringKey }) {
  return useStrings()[k];
}
