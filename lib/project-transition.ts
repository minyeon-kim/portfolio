"use client";

// A page's canvas: its background colour, plus the Devsign dot grid when the
// page is a design-tool canvas, so a transition bridge can continue it.
export type Surface = { color: string; dots: { image: string; size: string } | null; intro: boolean };
export function surfaceOf(root: ParentNode = document): Surface {
  const canvas = root.querySelector<HTMLElement>("main .selected-stage, main .project-hero, main .intro-stage")
    ?? root.querySelector<HTMLElement>(".selected-stage, .project-hero, .intro-stage");
  const style = getComputedStyle(canvas ?? document.body);
  const color = style.backgroundColor === "rgba(0, 0, 0, 0)" || style.backgroundColor === "transparent"
    ? getComputedStyle(document.body).backgroundColor : style.backgroundColor;
  const dots = canvas?.closest("[data-canvas]") || canvas?.matches("[data-canvas]")
    ? { image: style.backgroundImage, size: style.backgroundSize } : null;
  return { color, dots, intro: Boolean(canvas?.matches(".intro-stage")) };
}

// Bridge height: a multiple of the 24px dot grid so the dots line up with the
// page they lead into.
export const bridgeHeight = () => Math.max(24, Math.round((window.innerHeight * 0.4) / 24) * 24);

// A fixed band that eases one canvas into the next between two moving pages.
// Dot grids fade in towards the side they belong to.
// Copies an intro light layer with each field pinned at its current drift.
export function freezeAmbient(source: HTMLElement) {
  const copy = source.cloneNode(true) as HTMLElement;
  const live = source.querySelectorAll<HTMLElement>("span");
  copy.querySelectorAll<HTMLElement>("span").forEach((span, index) => {
    const style = live[index] ? getComputedStyle(live[index]) : null;
    span.style.animation = "none";
    if (style) { span.style.transform = style.transform; span.style.opacity = style.opacity; }
  });
  return copy;
}

export function createBridge(height: number, top: Surface, bottom: Surface, ambient?: HTMLElement | null) {
  const bridge = document.createElement("div");
  bridge.className = "project-navigation-bridge";
  bridge.setAttribute("aria-hidden", "true");
  Object.assign(bridge.style, { height: `${height}px`, background: `linear-gradient(to bottom, ${top.color}, ${bottom.color})` });
  // The intro's ambient edge light continues into the band: a copy of its light
  // layer (frozen at the current drift) is placed as if the intro extended
  // below its edge, so the part that the intro clipped shows here, fading out.
  if (top.intro && ambient) {
    const surface = ambient.parentElement?.getBoundingClientRect();
    const wrap = document.createElement("span");
    const mask = "linear-gradient(to bottom, #000, transparent)";
    Object.assign(wrap.style, { position: "absolute", inset: "0", overflow: "clip", maskImage: mask });
    wrap.style.setProperty("-webkit-mask-image", mask);
    const copy = freezeAmbient(ambient);
    Object.assign(copy.style, {
      position: "absolute", left: "0", top: `${-(surface?.height ?? window.innerHeight)}px`,
      width: `${surface?.width ?? window.innerWidth}px`, height: `${surface?.height ?? window.innerHeight}px`,
      maskImage: "none", zIndex: "0", overflow: "visible",
    });
    copy.style.setProperty("-webkit-mask-image", "none");
    wrap.appendChild(copy);
    bridge.appendChild(wrap);
  }
  ([[top, "to top"], [bottom, "to bottom"]] as const).forEach(([end, direction]) => {
    if (!end.dots) return;
    const dots = document.createElement("span");
    const mask = `linear-gradient(${direction}, transparent, #000)`;
    Object.assign(dots.style, {
      position: "absolute", inset: "0", backgroundImage: end.dots.image, backgroundSize: end.dots.size,
      backgroundPosition: "12px 12px", maskImage: mask,
    });
    dots.style.setProperty("-webkit-mask-image", mask);
    bridge.appendChild(dots);
  });
  return bridge;
}

// A curved incoming page rises over a slower outgoing page for subtle depth.
export function revealNextProject(change: () => void, ready: () => boolean) {
  if (document.documentElement.hasAttribute("data-project-navigation")) return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) {
    change();
    return;
  }
  const canvasColor = () => {
    const canvas = main.querySelector<HTMLElement>(".selected-stage, .project-hero, .intro-stage");
    const color = getComputedStyle(canvas ?? main).backgroundColor;
    return color === "rgba(0, 0, 0, 0)" || color === "transparent" ? getComputedStyle(document.body).backgroundColor : color;
  };
  const outgoingColor = canvasColor();
  const outgoingSurface = surfaceOf();
  // A focused Next button must not pull the new document back to its old row.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const bounds = main.getBoundingClientRect();
  const snapshot = main.cloneNode(true) as HTMLElement;
  const sourceCanvases = main.querySelectorAll("canvas");
  snapshot.querySelectorAll("canvas").forEach((copy, index) => {
    const source = sourceCanvases[index];
    if (source && source.width && source.height) copy.getContext("2d")?.drawImage(source, 0, 0);
  });
  snapshot.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  // Animations are off inside the snapshot; keep the ambient light where it was.
  const liveAmbient = main.querySelector<HTMLElement>(".intro-ambient");
  const snapAmbient = snapshot.querySelector<HTMLElement>(".intro-ambient");
  if (liveAmbient && snapAmbient) snapAmbient.replaceWith(freezeAmbient(liveAmbient));
  Object.assign(snapshot.style, { position: "absolute", top: `${bounds.top}px`, left: `${bounds.left}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, margin: "0" });
  const backdrop = document.createElement("div");
  backdrop.className = "project-navigation-backdrop";
  backdrop.style.backgroundColor = outgoingColor;
  backdrop.inert = true;
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.appendChild(snapshot);
  document.body.appendChild(backdrop);
  document.documentElement.dataset.projectNavigation = "true";
  const animations: Animation[] = [];
  let bridge: HTMLDivElement | null = null;
  let incoming: HTMLElement | null = null;
  const mainStyle = { position: main.style.position, top: main.style.top, left: main.style.left, width: main.style.width, height: main.style.height, overflow: main.style.overflow, paddingTop: main.style.paddingTop, zIndex: main.style.zIndex, backgroundColor: main.style.backgroundColor, borderRadius: main.style.borderRadius, willChange: main.style.willChange };
  const floor = document.createElement("div");
  floor.className = "project-navigation-floor";
  floor.style.backgroundColor = outgoingColor;
  floor.inert = true;
  floor.setAttribute("aria-hidden", "true");
  document.body.appendChild(floor);
  // Lock the actual document during the animation. Scrolling the live document
  // behind clones allowed browser anchoring/inertial input to survive the swap.
  const body = document.body;
  const bodyStyle = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width };
  const bodyWidth = body.getBoundingClientRect().width;
  Object.assign(body.style, { position: "fixed", top: "0px", left: "0px", width: `${bodyWidth}px` });
  // Wheel input is swallowed during the slide and for as long as the momentum
  // of the click-time scroll keeps arriving afterwards; only a fresh gesture
  // (after a short pause) scrolls the new page. Chrome sends momentum wheel
  // events as non-cancelable, so preventDefault alone can't stop them: the
  // root is made non-scrollable (overflow hidden) until the momentum ends.
  let lastWheel = 0;
  const blockScroll = (event: Event) => {
    if (event.type === "wheel") lastWheel = performance.now();
    event.preventDefault();
  };
  window.addEventListener("wheel", blockScroll, { passive: false });
  window.addEventListener("touchmove", blockScroll, { passive: false });
  let started = false;
  let scrollFrame = 0;
  const holdAtTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    scrollFrame = requestAnimationFrame(holdAtTop);
  };
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    observer.disconnect();
    clearTimeout(timeout);
    cancelAnimationFrame(scrollFrame);
    animations.forEach((animation) => animation.cancel());
    bridge?.remove();
    Object.assign(main.style, mainStyle);
    Object.assign(body.style, bodyStyle);
    const heading = main.querySelector<HTMLElement>(".selected-stage-title, .project-hero h1, h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    const top = started ? 0 : -bounds.top;
    window.scrollTo({ top, left: 0, behavior: "instant" });
    // Keep the incoming viewport visible until the restored document has laid out.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top, left: 0, behavior: "instant" });
      floor.remove();
      backdrop.remove();
      delete document.documentElement.dataset.projectNavigation;
      window.removeEventListener("touchmove", blockScroll);
      const root = document.documentElement;
      const rootOverflow = root.style.overflow;
      const releasedAt = performance.now();
      const releaseWhenIdle = () => {
        const now = performance.now();
        if (now - lastWheel < 220 && now - releasedAt < 2500) {
          root.style.overflow = "hidden";
          if (window.scrollY !== top) window.scrollTo({ top, left: 0, behavior: "instant" });
          requestAnimationFrame(releaseWhenIdle);
          return;
        }
        root.style.overflow = rootOverflow;
        window.removeEventListener("wheel", blockScroll);
      };
      releaseWhenIdle();
    }));
  };
  const begin = () => {
    if (started || !ready()) return;
    started = true;
    observer.disconnect();
    holdAtTop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(cleanup);
      return;
    }
    main.querySelector<HTMLElement>("[data-stage-index], [data-case-slug]")?.setAttribute("data-project-arrived", "true");
    // Capture the new title at scroll zero before animating viewport layers.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Animate the actual destination, so there is no snapshot-to-document
      // handoff with different sticky/scroll geometry at the end.
      const rect = main.getBoundingClientRect();
      incoming = main;
      // The layer starts at the viewport top, not below the header: the stage
      // slides up under the header (negative margin), and clipping at main's
      // top left the old page showing in that strip until the very last frame.
      const offset = Math.max(0, rect.top);
      const padding = parseFloat(getComputedStyle(main).paddingTop) || 0;
      Object.assign(main.style, {
        position: "fixed", top: `${rect.top - offset}px`, left: `${rect.left}px`,
        width: `${rect.width}px`, height: `${window.innerHeight}px`, paddingTop: `${padding + offset}px`,
        overflow: "clip", zIndex: "19", backgroundColor: canvasColor(), willChange: "transform",
      });
      // Gentle start and a long, even landing: no fast burst followed by a dead crawl.
      const timing = { duration: 1300, easing: "cubic-bezier(0.45, 0, 0.12, 1)", fill: "forwards" as FillMode };
      // One continuous strip, like scrolling down a single page: the old view,
      // a colour bridge (old canvas -> new canvas) and the new page move up
      // together at the same speed, so there is no seam and no layer drifting
      // against another. The bridge ends above the viewport, so it never
      // covers the new title.
      const gap = bridgeHeight();
      bridge = createBridge(gap, outgoingSurface, surfaceOf(), liveAmbient);
      bridge.style.top = `${-gap}px`;
      document.body.appendChild(bridge);
      const rise = [{ transform: `translate3d(0, calc(100svh + ${gap}px), 0)` }, { transform: "translate3d(0, 0, 0)" }];
      animations.push(bridge.animate(rise, timing));
      // The old view's lower part dissolves into its own canvas colour (the
      // floor behind it), so its colour fields don't end at a hard line where
      // the bridge begins.
      if (!outgoingSurface.intro) {
        backdrop.classList.add("project-navigation-dissolve");
        animations.push(backdrop.animate([{ "--dissolve": "100%" }, { "--dissolve": "55%" }], { ...timing, duration: timing.duration * 0.4 }));
      }
      // The selection colour flow fades out as the slide starts; the quieter
      // ambient edge light stays and continues into the bridge.
      backdrop.querySelectorAll<HTMLElement>(".hero-sculpture").forEach((layer) => {
        animations.push(layer.animate(
          [{ opacity: getComputedStyle(layer).opacity }, { opacity: 0 }],
          { duration: timing.duration * 0.35, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
        ));
      });
      animations.push(backdrop.animate(
        [{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(0, calc(-100svh - ${gap}px), 0)` }], timing,
      ));
      const slide = incoming.animate(rise, timing);
      animations.push(slide);
      // Follow-through: the opener's parts trail the page a little and land just
      // after it, so the motion settles instead of stopping as one slab. These run
      // on the live elements and finish on their own after cleanup.
      const parts: [string, number, number][] = [
        [".selected-stage-title, .project-hero-title", 64, 0],
        [".selected-stage-meta > div, .project-hero-details > div", 96, 60],
        [".selected-stage-object, .project-hero-cover", 140, 140],
      ];
      parts.forEach(([selector, lag, stagger]) => {
        main.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          element.animate(
            [{ translate: `0 ${lag}px` }, { translate: "0 0" }],
            { duration: timing.duration + 320 + stagger + index * 50, easing: "cubic-bezier(0.5, 0, 0.1, 1)", fill: "backwards" },
          );
        });
      });
      void slide.finished.catch(() => {}).finally(cleanup);
    }));
  };
  const observer = new MutationObserver(begin);
  const timeout = setTimeout(cleanup, 5000);
  observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-stage-index", "data-case-slug"] });
  if (window.location.hash) {
    history.replaceState(history.state, "", window.location.pathname + window.location.search);
  }
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  change();
  begin();
}
