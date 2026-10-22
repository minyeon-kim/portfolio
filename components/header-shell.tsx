"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useUi } from "@/lib/ui-store";

// Marks the header `data-compact` once the page has scrolled a little, so CSS
// can fold the full-width bar into a small floating one (md and up).
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  // On the landing page the header floats over the full-screen cover.
  const pathname = usePathname();
  const overStage = pathname === "/";
  // Project and About pages open on their own full-bleed hero, so the header
  // floats over it instead of laying a bar across the top.
  const overHero = pathname.startsWith("/work/") || pathname.startsWith("/about");
  const activeCase = useUi((state) => state.activeCase);
  const canCompact = pathname.startsWith("/work/") || pathname.startsWith("/about") || (overStage && activeCase !== null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = canCompact && window.scrollY > 64;
      ref.current?.toggleAttribute("data-compact", next);
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
      className={`group/header z-20 transition-[background-color] duration-400 ease-standard md:sticky md:top-0 md:data-compact:bg-transparent md:data-compact:backdrop-blur-none ${
        overStage || overHero
          ? "bg-bg/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          : "bg-bg/90 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}
