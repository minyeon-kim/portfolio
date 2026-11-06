"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useUi } from "@/lib/ui-store";
import { stripLocale } from "@/lib/i18n";

// After metalab.com: the header stays on screen and folds with the scroll, from the
// full-width bar into one floating pill. `--fold` (0 to 1) follows the scroll position
// between FOLD_FROM and FOLD_TO and drives the CSS; with reduced motion it just switches.
const FOLD_FROM = 35;
const FOLD_TO = 281;

export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  // On the landing page the header floats over the full-screen cover.
  const pathname = stripLocale(usePathname());
  const activeCase = useUi((state) => state.activeCase);
  // A case open on the landing has its own URL but is still the landing's stage.
  const overStage = pathname === "/" || (pathname.startsWith("/work/") && activeCase !== null);
  // Project and About pages open on their own full-bleed hero, so the header
  // floats over it instead of laying a bar across the top.
  const overHero = pathname.startsWith("/work/") || pathname.startsWith("/about");
  const canFold = !(pathname === "/" && activeCase === null);
  const menuOpen = useUi((state) => state.menuOpen);

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frame = 0;
      const header = ref.current;
      if (!header) return;
      const y = window.scrollY;
      // It steps out of the way while reading down and comes back on any scroll up,
      // so it never sits over the content being read. Small jitters are ignored.
      const delta = y - lastY;
      if (Math.abs(delta) > 6) {
        header.toggleAttribute("data-hide", canFold && !menuOpen && delta > 0 && y > 160);
        lastY = y;
      }
      if (y <= 160 || menuOpen) header.removeAttribute("data-hide");
      const fold = !canFold || menuOpen ? 0 : reduced.matches ? Number(y > FOLD_FROM) : Math.min(1, Math.max(0, (y - FOLD_FROM) / (FOLD_TO - FOLD_FROM)));
      header.style.setProperty("--fold", fold.toFixed(3));
      header.toggleAttribute("data-compact", fold > 0);
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
  }, [canFold, menuOpen]);

  return (
    <header
      ref={ref}
      data-home={overStage || undefined}
      data-intro={(overStage && activeCase === null) || undefined}
      data-photo={pathname.startsWith("/about") || undefined}
      className={`group/header z-20 transition-[background-color] duration-400 ease-standard sticky top-0 data-compact:bg-transparent data-compact:backdrop-blur-none ${
        overStage || overHero
          ? "bg-bg/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          : "bg-bg/90 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}
