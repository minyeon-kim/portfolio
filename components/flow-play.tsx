"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Shows a sequence as the page scrolls (owner: scrolling on should bring the next motion, not a
// timer): the further the block has risen through the screen, the more of its parts are shown,
// in order (`--i` on each part, or the order of the list items). It only moves forward, so
// scrolling back doesn't undo it. `--sp` (0–1, the furthest reached) is also set for lines that
// draw with it. Parts are hidden only after this runs (data-armed), so without JS everything is
// simply there; reduced motion shows it at once.
export function FlowPlay({ className, children, from = 0.9, to = 0.35 }: { className: string; children: ReactNode; from?: number; to?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = [...el.querySelectorAll<HTMLElement | SVGElement>("[data-seq], ol.dv-flow > li")];
    const order = parts.map((p, k) => {
      const i = parseFloat(getComputedStyle(p).getPropertyValue("--i"));
      return Number.isFinite(i) ? i : k;
    });
    const last = Math.max(0, ...order);
    const target = el.querySelector("svg") ?? el;
    let reached = 0;
    let frame = 0;
    const read = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = target.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (vh * from - top) / (vh * (from - to))));
      if (p <= reached && reached > 0) return;
      reached = Math.max(reached, p);
      el.style.setProperty("--sp", reached.toFixed(3));
      const shown = reached * (last + 1);
      parts.forEach((part, k) => { if (order[k] < shown) part.setAttribute("data-on", ""); });
      if (reached >= 1) stop();
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    const stop = () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
    el.dataset.armed = "";
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); stop(); };
  }, [from, to]);
  return <div ref={ref} className={className}>{children}</div>;
}
