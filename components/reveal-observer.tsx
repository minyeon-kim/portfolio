"use client";

import { useLayoutEffect } from "react";

const STEP_MS = 90; // stagger between items that come into view together
const MAX_STEPS = 4; // so nothing waits more than ~0.4s

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
        entering.forEach((e, i) => {
          show(e.target as HTMLElement, Math.min(i, MAX_STEPS) * STEP_MS);
          observer.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
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
        for (const el of els) {
          const box = el.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            show(el, Math.min(step++, MAX_STEPS) * STEP_MS);
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
