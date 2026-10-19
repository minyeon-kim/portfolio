"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The landing page is a single full screen; chrome like the footer stays off it.
export function HideOnHome({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? null : children;
}
