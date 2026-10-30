"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useUi } from "@/lib/ui-store";
import { stripLocale } from "@/lib/i18n";

// Marks the header `data-compact` once the page has scrolled a little, so CSS
// can fold the full-width bar into a small floating one (md and up). Scrolling
// down past the top also sets `data-hidden` so the bar slides away from the
// content; any scroll up, or focus inside the header, brings it back.
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  // On the landing page the header floats over the full-screen cover.
  const pathname = stripLocale(usePathname());
  const overStage = pathname === "/";
  // Project and About pages open on their own full-bleed hero, so the header
  // floats over it instead of laying a bar across the top.
  const overHero = pathname.startsWith("/work/") || pathname.startsWith("/about");
  const activeCase = useUi((state) => state.activeCase);
  const canCompact = pathname.startsWith("/work/") || pathname.startsWith("/about") || (overStage && activeCase !== null);

  useEffect(() => {
    let frame = 0;
    let last = window.scrollY;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const header = ref.current;
      if (!header) return;
      header.toggleAttribute("data-compact", canCompact && y > 64);
      const delta = y - last;
      if (Math.abs(delta) > 4) {
        const keep = header.contains(document.activeElement) || header.querySelector('[aria-expanded="true"]');
        header.toggleAttribute("data-hidden", delta > 0 && y > 120 && !keep);
        last = y;
      }
      if (y <= 120) header.removeAttribute("data-hidden");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [canCompact]);

  return (
    <header
      ref={ref}
      data-home={overStage || undefined}
      className={`group/header z-20 transition-[background-color] duration-400 ease-standard sticky top-0 md:data-compact:bg-transparent md:data-compact:backdrop-blur-none ${
        overStage || overHero
          ? "bg-bg/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          : "bg-bg/90 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}
