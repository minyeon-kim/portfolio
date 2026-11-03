"use client";

import { useLayoutEffect } from "react";

const STEP_MS = 100; // stagger between groups that come into view together
const MAX_STEPS = 4; // so nothing waits more than ~0.4s
// A text block (label, heading, body) rises as one piece instead of line by
// line (class feedback: sections should come up together, at one pace).
const GROUP = ".dv-block, [data-reveal-group]";
// In a case body the unit is a whole block of a stage (a direct child of the
// stage section): it rises as one piece and everything inside shows with it.
const UNIT = ".dv > section > *";

// A block taller than most of the screen would play out while only its first
// line shows, so nobody saw it rise. Its own parts rise instead.
const unitOf = (el: HTMLElement): HTMLElement | null => {
  const top = el.closest<HTMLElement>(UNIT);
  if (!top) return null;
  let unit: HTMLElement = top;
  while (unit.dataset.revealUnit === undefined && unit.tagName === "DIV" && unit.offsetHeight > window.innerHeight * 0.8) {
    const part: HTMLElement | undefined = ([...unit.children] as HTMLElement[]).find((child) => child.contains(el));
    if (!part) break;
    unit = part;
  }
  unit.dataset.revealUnit = "";
  return unit;
};

// Fades `.reveal` elements in as they scroll into view. Elements that enter
// in the same moment appear one after another. Everything stays visible until
// this runs, and anything already on screen at load is shown immediately, so
// content is never hidden without JS. Off with reduced motion (globals.css).
export function RevealObserver() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;

    const show = (el: HTMLElement, delay = 0) => {
      if (delay) {
        el.style.transitionDelay = `${delay}ms`;
        el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
      }
      el.dataset.shown = "";
      const unit = unitOf(el);
      if (unit && unit.dataset.shown === undefined) {
        if (delay) {
          unit.style.transitionDelay = `${delay}ms`;
          unit.addEventListener("transitionend", () => (unit.style.transitionDelay = ""), { once: true });
        }
        unit.dataset.shown = "";
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Anything already scrolled past (e.g. after a jump) shows at once.
        for (const e of entries) {
          if (!e.isIntersecting && e.boundingClientRect.bottom < 0) {
            show(e.target as HTMLElement);
            observer.unobserve(e.target);
          }
        }
        const entering = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          );
        let step = 0;
        for (const e of entering) {
          const el = e.target as HTMLElement;
          if (el.dataset.shown !== undefined) continue;
          const group = unitOf(el) ?? el.closest<HTMLElement>(GROUP);
          const members = group ? [...group.querySelectorAll<HTMLElement>(".reveal:not([data-shown])")] : [el];
          const delay = Math.min(step++, MAX_STEPS) * STEP_MS;
          for (const m of members) {
            show(m, delay);
            observer.unobserve(m);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    const watch = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(".reveal:not([data-shown])").forEach((el) => {
        unitOf(el);
        // Already on screen: show now, before the first paint.
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
        else observer.observe(el);
      });
    };

    watch(document);
    root.classList.add("reveal-ready");

    // A jump (stage nav, anchor, a fast fling) can carry an element from
    // below the screen to above it without it ever intersecting, so the
    // observer never reports it. When scrolling settles, show everything
    // above the bottom of the screen that is still hidden.
    let settle = 0;
    const catchUp = () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>(".reveal:not([data-shown])").forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            show(el);
            observer.unobserve(el);
          }
        });
      }, 120);
    };
    window.addEventListener("scroll", catchUp, { passive: true });

    // Play the reveal again inside a container, e.g. when the work selector
    // swaps in another case. Dispatch: new CustomEvent("reveal:replay", { detail: el }).
    const replay = (event: Event) => {
      const scope = (event as CustomEvent<Element>).detail;
      const els = [...scope.querySelectorAll<HTMLElement>(".reveal")];
      const units = [...scope.querySelectorAll<HTMLElement>("[data-reveal-unit]")];
      for (const el of [...els, ...units]) {
        el.style.transition = "none"; // hide instantly, don't fade out
        delete el.dataset.shown;
      }
      void scope.getBoundingClientRect(); // commit the hidden state
      for (const el of [...els, ...units]) el.style.transition = "";
      requestAnimationFrame(() => {
        let step = 0;
        const delays = new Map<Element, number>();
        for (const el of els) {
          const box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            const key = unitOf(el) ?? el.closest(GROUP) ?? el;
            if (!delays.has(key)) delays.set(key, Math.min(step++, MAX_STEPS) * STEP_MS);
            show(el, delays.get(key));
          } else {
            observer.observe(el);
          }
        }
      });
    };
    window.addEventListener("reveal:replay", replay);

    // Client-side navigation swaps page content; pick up new elements.
    // Text-only changes (the hero scramble) are ignored, and rescans are
    // batched to one per frame.
    let frame = 0;
    const mutations = new MutationObserver((records) => {
      const addedElements = records.some((r) => [...r.addedNodes].some((n) => n instanceof Element));
      if (addedElements && !frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          watch(document);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", catchUp);
      window.removeEventListener("reveal:replay", replay);
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
