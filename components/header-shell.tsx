"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Marks the header `data-compact` once the page has scrolled a little, so CSS
// can fold the full-width bar into a small floating one (md and up).
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      ref.current?.toggleAttribute("data-compact", window.scrollY > 64);
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
      className="group/header z-20 bg-bg/90 backdrop-blur-sm transition-[background-color] duration-400 ease-standard md:sticky md:top-0 md:data-compact:bg-transparent md:data-compact:backdrop-blur-none"
    >
      {children}
    </header>
  );
}
