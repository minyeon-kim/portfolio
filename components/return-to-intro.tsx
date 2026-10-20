"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setUi, useUi } from "@/lib/ui-store";
import { bridgeHeight, createBridge, shadeInto, surfaceOf } from "@/lib/project-transition";

// Only an additional upward gesture at the page top returns to the intro.
export function ReturnToIntro() {
  const pathname = usePathname();
  const router = useRouter();
  const active = useUi((state) => state.activeCase);
  const menuOpen = useUi((state) => state.menuOpen);

  useEffect(() => {
    if (menuOpen || !(pathname.startsWith("/work/") || /^\/about\/?$/.test(pathname) || (pathname === "/" && active !== null))) return;
    let returned = false;
    const openedAt = performance.now();
    let topSince = window.scrollY <= 2 ? openedAt : 0;
    let lastWheel = 0;
    let eligible = false;
    let amount = 0;
    let touchY: number | null = null;
    const nested = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return true;
      if (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return true;
      for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 2) return true;
      }
      return false;
    };
    const goHome = () => {
      if (returned || document.documentElement.hasAttribute("data-project-navigation") || performance.now() - openedAt < 1000) return;
      returned = true;
      const main = document.querySelector("main");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let layer: HTMLDivElement | null = null;
      const detailSurface = surfaceOf();
      if (main && !reduce) {
        const bounds = main.getBoundingClientRect();
        const snapshot = main.cloneNode(true) as HTMLElement;
        snapshot.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
        Object.assign(snapshot.style, {
          position: "absolute", top: `${bounds.top}px`, left: `${bounds.left}px`,
          width: `${bounds.width}px`, height: `${bounds.height}px`, margin: "0",
        });
        layer = document.createElement("div");
        layer.className = "return-to-main-layer";
        // The strip above main (header zone) takes the detail canvas colour, so
        // it doesn't show as a band between the bridge and the page.
        layer.style.background = detailSurface.color;
        if (detailSurface.dots) {
          Object.assign(layer.style, {
            backgroundImage: detailSurface.dots.image, backgroundSize: detailSurface.dots.size,
            backgroundPosition: `12px ${(((bounds.top + 12) % 24) + 24) % 24}px`,
          });
        }
        layer.inert = true;
        layer.setAttribute("aria-hidden", "true");
        layer.appendChild(snapshot);
        document.body.appendChild(layer);
      }
      const focusInput = () => document.getElementById("project-query")?.focus({ preventScroll: true });
      if (layer) {
        const outgoing = layer;
        let started = false;
        const observer = new MutationObserver(() => {
          if (document.querySelector("main .intro-stage")) slideDown();
        });
        const timeout = setTimeout(() => { observer.disconnect(); outgoing.remove(); }, 4000);
        const slideDown = () => {
          if (started) return;
          started = true;
          observer.disconnect();
          clearTimeout(timeout);
          requestAnimationFrame(() => {
            // Same one-strip motion as opening a project, in reverse: the intro,
            // a colour bridge and the detail move down together at one speed.
            const gap = bridgeHeight();
            const intro = document.querySelector<HTMLElement>("main");
            const bridge = createBridge(gap, surfaceOf(), detailSurface);
            bridge.style.top = `${-gap}px`;
            document.body.appendChild(bridge);
            const timing = { duration: 1100, easing: "cubic-bezier(0.45, 0, 0.12, 1)", fill: "forwards" as FillMode };
            const drop = [{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(0, calc(100svh + ${gap}px), 0)` }];
            const bridgeMotion = bridge.animate(drop, timing);
            const introMotion = intro?.animate(
              [{ transform: `translate3d(0, calc(-100svh - ${gap}px), 0)` }, { transform: "translate3d(0, 0, 0)" }], timing,
            );
            // The intro keeps its ambient light; its lower part eases into the
            // detail canvas (meeting the bridge) while it travels and clears as
            // it lands.
            const introPosition = intro?.style.position ?? "";
            const shade = shadeInto(detailSurface.color);
            if (intro) { intro.style.position = "relative"; intro.appendChild(shade); }
            shade.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], timing);
            const motion = outgoing.animate(drop, timing);
            void motion.finished.catch(() => {}).finally(() => {
              introMotion?.cancel();
              shade.remove();
              if (intro) intro.style.position = introPosition;
              bridgeMotion.cancel();
              bridge.remove();
              outgoing.remove();
              focusInput();
            });
          });
        };
        observer.observe(document.body, { childList: true, subtree: true });
      }
      setUi({ activeCase: null, menuOpen: false, railVisible: true });
      if (pathname !== "/") router.push("/", { scroll: true });
      else {
        window.scrollTo({ top: 0, behavior: "instant" });
        if (!layer) requestAnimationFrame(focusInput);
      }
    };
    const scroll = () => {
      if (window.scrollY > 2) { topSince = 0; amount = 0; eligible = false; }
      else if (!topSince) topSince = performance.now();
    };
    const wheel = (event: WheelEvent) => {
      const now = performance.now();
      const fresh = now - lastWheel > 180;
      lastWheel = now;
      if (event.ctrlKey || event.deltaY >= 0 || window.scrollY > 2 || nested(event.target)) {
        amount = 0;
        eligible = false;
        return;
      }
      if (fresh) { amount = 0; eligible = topSince > 0 && now - topSince >= 300; }
      if (!eligible) return;
      const delta = Math.abs(event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      amount += Math.min(delta, 120);
      if (amount >= 120) goHome();
    };
    const touchStart = (event: TouchEvent) => {
      touchY = window.scrollY <= 2 && topSince > 0 && performance.now() - topSince >= 300 && !nested(event.target) && event.touches.length === 1 ? event.touches[0].clientY : null;
    };
    const touchEnd = (event: TouchEvent) => {
      if (touchY !== null && window.scrollY <= 2 && event.changedTouches[0]?.clientY - touchY >= 100) goHome();
      touchY = null;
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchend", touchEnd);
    };
  }, [active, menuOpen, pathname, router]);

  return null;
}
