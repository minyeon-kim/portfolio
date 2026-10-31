"use client";

import { useEffect } from "react";

// Eased wheel scrolling (class feedback: the scroll felt flat, "not fun"). The wheel only
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

    // Scroll speed as CSS variables, for any kind of scroll (wheel, trackpad,
    // keys): --sv is the eased, signed speed in -1..1, --sva its size. Case
    // blocks lean and images swell a little with it, then settle (globals.css).
    let speedFrame = 0;
    let prevY = window.scrollY;
    let prevT = 0;
    let speed = 0;
    const speedTick = (now: number) => {
      const dt = Math.max(8, Math.min(48, now - prevT || 16));
      prevT = now;
      const y = window.scrollY;
      const v = ((y - prevY) / dt) * 16; // px per 60fps frame
      prevY = y;
      speed += (Math.max(-1, Math.min(1, v / 70)) - speed) * (1 - Math.exp(-dt / 90));
      if (Math.abs(speed) < 0.002 && Math.abs(v) < 0.5) {
        speed = 0;
        root.style.removeProperty("--sv");
        root.style.removeProperty("--sva");
        speedFrame = 0;
        return;
      }
      root.style.setProperty("--sv", speed.toFixed(3));
      root.style.setProperty("--sva", Math.abs(speed).toFixed(3));
      speedFrame = requestAnimationFrame(speedTick);
    };
    const track = () => {
      if (reduce.matches || speedFrame) return;
      prevY = window.scrollY;
      prevT = performance.now();
      speedFrame = requestAnimationFrame(speedTick);
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("scroll", track, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(speedFrame);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("scroll", track);
    };
  }, []);

  return null;
}
