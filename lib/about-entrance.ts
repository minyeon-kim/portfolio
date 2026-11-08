// Entering About from the landing: hovering About lays out its world with the
// portrait as a card (HomeIntro). Clicking lifts the photo from that card (`from`),
// swaps the page in behind it, and moves the photo into its place in the About
// opener while the page appears round it, so it is one continuous picture.
// Without a card the photo fades in full screen first.

export type Box = { left: number; top: number; width: number; height: number };

// Where the About opener puts the photo: the whole screen (see .about-hero-photo).
export function portraitBox(): Box {
  return { left: 0, top: 0, width: document.documentElement.clientWidth, height: window.innerHeight };
}

// The hero's crop of the same photo; the landing card shows it from 50% 28%.
const HERO_POSITION = "50% 0%";

const FADE = 240, SETTLE = 720;

export function enterAbout(box: Box, src: string, go: () => void, ready: () => boolean, from?: Box) {
  const root = document.documentElement;
  const layer = document.createElement("div");
  layer.className = "about-entrance";
  layer.setAttribute("aria-hidden", "true");
  const photo = document.createElement("img");
  photo.src = src;
  photo.alt = "";
  if (from) {
    layer.dataset.card = "";
    Object.assign(photo.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: "8px", objectPosition: "50% 28%" });
  }
  layer.append(photo);
  document.body.append(layer);

  const settle = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    layer.dataset.reveal = "";
    const animation = photo.animate(
      [
        from
          ? { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: "8px", objectPosition: "50% 28%" }
          : { left: "0px", top: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px", objectPosition: HERO_POSITION },
        { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: "0px", objectPosition: HERO_POSITION },
      ],
      { duration: SETTLE, easing: "cubic-bezier(0.65, 0, 0.2, 1)", fill: "forwards" },
    );
    animation.onfinish = () => {
      layer.remove();
      root.removeAttribute("data-project-navigation");
    };
  };
  const swap = () => {
    layer.dataset.ground = "";
    root.setAttribute("data-project-navigation", "");
    go();
    const started = performance.now();
    const wait = () => {
      if (ready() || performance.now() - started > 4000) requestAnimationFrame(settle);
      else requestAnimationFrame(wait);
    };
    wait();
  };
  // On the next frame, so the photo's fade runs from 0.
  requestAnimationFrame(() => {
    layer.dataset.photo = "";
    window.setTimeout(swap, FADE);
  });
}
