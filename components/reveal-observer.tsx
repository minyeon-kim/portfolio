"use client";

import { useLayoutEffect } from "react";

const STEP_MS = 60; // stagger between groups that come into view together
const MAX_STEPS = 3; // so nothing waits more than ~0.2s
// A text block (label, heading, body) rises as one piece instead of line by
// line (class feedback: sections should come up together, at one pace).
const GROUP = ".dv-block, [data-reveal-group]";

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
          const group = el.closest<HTMLElement>(GROUP);
          const members = group ? [...group.querySelectorAll<HTMLElement>(".reveal:not([data-shown])")] : [el];
          const delay = Math.min(step++, MAX_STEPS) * STEP_MS;
          for (const m of members) {
            show(m, delay);
            observer.unobserve(m);
          }
        }
      },
      { rootMargin: "0px 0px -4% 0px" },
    );

    const watch = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(".reveal:not([data-shown])").forEach((el) => {
        // Already on screen: show now, before the first paint.
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
        else observer.observe(el);
      });
    };

    watch(document);
    root.classList.add("reveal-ready");

    // Play the reveal again inside a container, e.g. when the work selector
    // swaps in another case. Dispatch: new CustomEvent("reveal:replay", { detail: el }).
    const replay = (event: Event) => {
      const scope = (event as CustomEvent<Element>).detail;
      const els = [...scope.querySelectorAll<HTMLElement>(".reveal")];
      for (const el of els) {
        el.style.transition = "none"; // hide instantly, don't fade out
        delete el.dataset.shown;
      }
      void scope.getBoundingClientRect(); // commit the hidden state
      for (const el of els) el.style.transition = "";
      requestAnimationFrame(() => {
        let step = 0;
        const delays = new Map<Element, number>();
        for (const el of els) {
          const box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            const key = el.closest(GROUP) ?? el;
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
      window.removeEventListener("reveal:replay", replay);
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
