"use client";

import { useEffect } from "react";

// Eased wheel scrolling (class feedback: the scroll felt flat). The wheel only
// sets a target; the page glides to it over ~0.3s. It still moves the real
// window scroll, so sticky blocks, scroll-driven animations and the top
// overscroll return keep working. Fine pointers only, never with reduced
// motion, and it steps aside for zoom, sideways scrolling, nested scrollers,
// open dialogs and page transitions (which lock scrolling themselves).
export function SmoothScroll() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    let target = window.scrollY;
    let frame = 0;
    let last = 0;
    let set = -1; // the last position this glide wrote

    const nested = (node: EventTarget | null) => {
      for (let el = node instanceof Element ? node : null; el && el !== document.body; el = el.parentElement) {
        if (el.matches('[role="dialog"], input, textarea, select')) return true;
        const overflow = getComputedStyle(el).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && el.scrollHeight > el.clientHeight + 2) return true;
      }
      return false;
    };
    const locked = () => root.hasAttribute("data-project-navigation") || getComputedStyle(root).overflowY === "hidden";
    const max = () => root.scrollHeight - window.innerHeight;

    const tick = (now: number) => {
      const dt = Math.max(8, Math.min(48, now - last)); // rAF time can trail the wheel event
      last = now;
      const y = window.scrollY;
      const next = y + (target - y) * (1 - Math.exp(-dt / 110));
      if (Math.abs(target - next) < 0.5) {
        window.scrollTo({ top: target, behavior: "instant" });
        frame = 0;
        return;
      }
      window.scrollTo({ top: next, behavior: "instant" });
      set = window.scrollY;
      frame = requestAnimationFrame(tick);
    };

    const wheel = (event: WheelEvent) => {
      if (!fine.matches || reduce.matches || event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || locked() || nested(event.target)) return;
      const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
      if (!frame) target = window.scrollY;
      target = Math.max(0, Math.min(max(), target + event.deltaY * unit));
      event.preventDefault();
      if (!frame) { last = performance.now(); set = window.scrollY; frame = requestAnimationFrame(tick); }
    };
    // Keys, the scrollbar, in-page links or a page transition moved the page:
    // drop the glide and follow.
    const scroll = () => {
      if (frame && Math.abs(window.scrollY - set) <= 2) return;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      target = window.scrollY;
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", scroll);
    };
  }, []);

  return null;
}
