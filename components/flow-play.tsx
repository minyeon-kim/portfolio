"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Plays the user flow in reading order once 35% of it is on screen. The parts are
// hidden only after this runs (data-armed), so without JS the chart is simply there.
export function FlowPlay({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.dataset.play = "";
      io.disconnect();
    }, { threshold: 0.35 });
    io.observe(el.querySelector("svg") ?? el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
