"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Marks the header `data-compact` once the page has scrolled a little, so CSS
// can fold the full-width bar into a small floating one (md and up).
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  // On the landing page the header floats over the full-screen cover.
  const overStage = usePathname() === "/";
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > 64;
      ref.current?.toggleAttribute("data-compact", next);
      setCompact(next);
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
  }, []);

  return (
    <header
      ref={ref}
      className={`group/header z-20 transition-[background-color] duration-400 ease-standard md:sticky md:top-0 md:data-compact:bg-transparent md:data-compact:backdrop-blur-none ${
        overStage
          ? `bg-bg/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none ${compact ? "" : "md:on-media"}`
          : "bg-bg/90 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}
