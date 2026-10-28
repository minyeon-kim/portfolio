"use client";

// A page's canvas: its background colour, plus the Devsign dot grid when the
// page is a design-tool canvas.
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

// The picked case's device grows to fill the screen, then settles into the
// case opener's media frame once the case page is there (after metalab.com).
// `live`: a page to show in the layer at the real viewport size (the Devsign
// prototype), scaling up from the device box and down into the opener; the
// device copy stands in until it has loaded.
// `prepared`: a layer built ahead of time (the live prototype, already loaded),
// used instead of building one now.
export type ZoomOptions = { from: HTMLElement; to: string; project: string; live?: string; prepared?: HTMLElement };

// The new page rises a short way and fades in over the old view, which drifts
// up slightly and fades out. The two overlap, so there is no seam between them.
// With `zoom`, the old view's device instead grows to the full screen first,
// and the new page fades in underneath while the device shrinks into its
// opener media frame.
export function revealNextProject(change: () => void, ready: () => boolean, zoom?: ZoomOptions) {
  if (document.documentElement.hasAttribute("data-project-navigation")) return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) {
    change();
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The device layer: a copy of the hovered device at its on-screen box, grown
  // to the viewport over 650ms while the old view leaves. Flattened as it
  // grows (its 3D pose animates to none).
  const grow = 650;
  const zoomStart = performance.now();
  let layer: HTMLElement | null = null;
  let liveFrame: HTMLIFrameElement | null = null;
  if (zoom && !reduced) {
    const source = zoom.from;
    const box = source.getBoundingClientRect();
    if (box.width > 10 && box.height > 10 && zoom.prepared) {
      layer = zoom.prepared;
      delete layer.dataset.prepared;
      liveFrame = layer.querySelector("iframe");
      if (liveFrame) Object.assign(liveFrame.style, { width: `${window.innerWidth}px`, height: `${window.innerHeight}px` });
      Object.assign(layer.style, { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
      layer.animate(
        [{ top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: "18px" },
         { top: "0px", left: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px" }],
        { duration: grow, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" },
      );
      liveFrame?.animate([{ transform: `scale(${box.width / window.innerWidth})` }, { transform: "scale(1)" }], { duration: grow, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });
    } else if (box.width > 10 && box.height > 10) {
      layer = document.createElement("div");
      layer.className = "project-zoom";
      layer.dataset.project = zoom.project;
      if (zoom.live) layer.dataset.live = "true";
      layer.inert = true;
      layer.setAttribute("aria-hidden", "true");
      const poster = (zoom.live ? source.querySelector<HTMLElement>(".devsign-loop") : null) ?? source;
      const copy = poster.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      // Cloned images are fetched from cache but decoded lazily; without this
      // the layer's first frame is its bare background.
      copy.querySelectorAll("img").forEach((img) => { img.loading = "eager"; img.decoding = "sync"; });
      layer.appendChild(copy);
      if (zoom.live) {
        liveFrame = document.createElement("iframe");
        liveFrame.className = "project-zoom-live";
        liveFrame.src = zoom.live;
        liveFrame.title = "";
        liveFrame.tabIndex = -1;
        liveFrame.setAttribute("aria-hidden", "true");
        liveFrame.setAttribute("sandbox", "allow-scripts allow-same-origin");
        Object.assign(liveFrame.style, { width: `${window.innerWidth}px`, height: `${window.innerHeight}px` });
        liveFrame.addEventListener("load", () => { if (liveFrame) liveFrame.dataset.loaded = "true"; });
        layer.appendChild(liveFrame);
        liveFrame.animate([{ transform: `scale(${box.width / window.innerWidth})` }, { transform: "scale(1)" }], { duration: grow, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });
      }
      Object.assign(layer.style, { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` });
      document.body.appendChild(layer);
      const posed = source.matches(".gemini-device, .home-device-window") ? source : source.querySelector<HTMLElement>(".gemini-device, .home-device-window");
      const posedCopy = posed === source ? copy : copy.querySelector<HTMLElement>(".gemini-device, .home-device-window");
      if (posed && posedCopy) {
        posedCopy.animate([{ transform: getComputedStyle(posed).transform }, { transform: "none" }], { duration: grow, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });
      }
      layer.animate(
        [{ top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: "18px" },
         { top: "0px", left: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px" }],
        { duration: grow, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" },
      );
    }
  }
  const canvasColor = () => {
    const canvas = main.querySelector<HTMLElement>(".selected-stage, .project-hero, .intro-stage");
    const color = getComputedStyle(canvas ?? main).backgroundColor;
    return color === "rgba(0, 0, 0, 0)" || color === "transparent" ? getComputedStyle(document.body).backgroundColor : color;
  };
  const outgoingColor = canvasColor();
  // A focused Next button must not pull the new document back to its old row.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const bounds = main.getBoundingClientRect();
  const snapshot = main.cloneNode(true) as HTMLElement;
  const sourceCanvases = main.querySelectorAll("canvas");
  snapshot.querySelectorAll("canvas").forEach((copy, index) => {
    const source = sourceCanvases[index];
    if (source && source.width && source.height) copy.getContext("2d")?.drawImage(source, 0, 0);
  });
  // Animations and transitions are off inside the snapshot, so anything caught
  // mid-animation would snap to its end state (e.g. dimmed intro copy popping
  // back to full opacity). Pin those elements at what is on screen now.
  const liveElements = Array.from(main.querySelectorAll<HTMLElement>("*"));
  const snapElements = Array.from(snapshot.querySelectorAll<HTMLElement>("*"));
  const moving = new Set(main.getAnimations({ subtree: true }).map((animation) => (animation.effect as KeyframeEffect | null)?.target).filter(Boolean));
  liveElements.forEach((element, index) => {
    const copy = snapElements[index];
    if (!copy || !(moving.has(element) || element.closest("[data-phase]"))) return;
    const style = getComputedStyle(element);
    Object.assign(copy.style, { visibility: style.visibility, opacity: style.opacity, transform: style.transform, filter: style.filter, translate: style.translate, scale: style.scale });
  });
  snapshot.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  // The chat has already faded before departure. Keep only its canvas in the
  // outgoing layer so cloned controls/text cannot reappear over the project.
  snapshot.querySelectorAll(".intro-copy").forEach((element) => element.remove());
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
    // Hide the old layers before cancelling: a cancelled fade would snap the
    // old view back to full opacity over the new page for the frames until
    // they are removed (seen as an afterimage).
    backdrop.style.visibility = "hidden";
    floor.style.visibility = "hidden";
    if (layer) { layer.style.visibility = "hidden"; const gone = layer; requestAnimationFrame(() => requestAnimationFrame(() => gone.remove())); }
    animations.forEach((animation) => animation.cancel());
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
    if (reduced) {
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
      // Sequenced, never overlapping content: the old view's content (text,
      // pills, media) lifts and blurs away in 140ms, so it can't linger as a
      // ghost, while its canvas stays as the ground the new page rises onto
      // (10vh, fading in from 160ms). No seam, no afterimage.
      // With the device layer: wait for it to fill the screen, hold it there a
      // moment (the prototype keeps playing), then fade the new page in while
      // the device shrinks into the opener's media frame.
      const wait = layer ? Math.max(0, grow - (performance.now() - zoomStart)) : 0;
      const timing = layer
        ? { duration: 750, delay: wait + 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" as FillMode }
        : { duration: 800, delay: 160, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" as FillMode };
      animations.push(snapshot.animate(
        [{ transform: "translate3d(0, 0, 0)", opacity: 1, filter: "blur(0px)" }, { transform: "translate3d(0, -2vh, 0)", opacity: 0, filter: "blur(6px)" }],
        { duration: layer ? 400 : 140, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
      ));
      const slide = incoming.animate(
        layer
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ transform: "translate3d(0, 10vh, 0)", opacity: 0 }, { transform: "translate3d(0, 0, 0)", opacity: 1 }],
        timing,
      );
      animations.push(slide);
      if (layer && zoom) {
        const target = incoming.querySelector<HTMLElement>(zoom.to);
        const box = target?.getBoundingClientRect();
        const radius = target ? getComputedStyle(target).borderRadius : "14px";
        if (box && box.width > 0) {
          const settle = layer.animate(
            [{ top: "0px", left: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px" },
             { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: radius }],
            { duration: timing.duration, delay: timing.delay, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" },
          );
          animations.push(settle);
          if (liveFrame) animations.push(liveFrame.animate([{ transform: "scale(1)" }, { transform: `scale(${box.width / window.innerWidth})` }], { duration: timing.duration, delay: timing.delay, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" }));
          // Blend into the real media over the last stretch.
          animations.push(layer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: timing.duration, delay: timing.delay, fill: "both" }));
        } else {
          animations.push(layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: timing.duration, delay: timing.delay, fill: "both" }));
        }
      }
      // Follow-through: the opener's parts trail the page a little and land just
      // after it, so the motion settles instead of stopping as one slab. These run
      // on the live elements and finish on their own after cleanup.
      const parts: [string, number, number][] = [
        [".selected-stage-title, .project-hero-title", 24, 0],
        [".selected-stage-meta > div, .project-hero-details > div", 36, 60],
        [".selected-stage-object, .project-hero-cover", 52, 120],
      ];
      parts.forEach(([selector, lag, stagger]) => {
        main.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          element.animate(
            [{ translate: `0 ${lag}px` }, { translate: "0 0" }],
            { duration: timing.duration + 200 + stagger + index * 50, delay: timing.delay, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" },
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
