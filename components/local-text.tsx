"use client";

import { type UiKey } from "@/lib/i18n";
import { useStrings } from "@/lib/use-locale";

// A UI string in the page's language, for server components and MDX.
export function T({ k }: { k: Exclude<UiKey, "switchTo"> }) {
  return useStrings()[k];
}
