// Entering About from the landing: hovering the header's About link prints the
// photo across the stage in dots (HeroObject, variant "portrait"). Clicking fades
// the real photo in over those dots, in the same crop, swaps the page in behind it,
// and shrinks the photo into its place in the About opener while the page
// appears round it, so it is one continuous picture.

export type Box = { left: number; top: number; width: number; height: number };

// Where the About opener puts the portrait (desktop): see .about-hero-portrait.
export function portraitBox(): Box {
  const vw = document.documentElement.clientWidth;
  const height = Math.min(window.innerHeight - 112, 760);
  const width = height * 0.8;
  return { left: vw - Math.max(56, (vw - 1200) / 2) - width, top: 88, width, height };
}

const FADE = 240, SETTLE = 720;

export function enterAbout(box: Box, src: string, go: () => void, ready: () => boolean) {
  const root = document.documentElement;
  const layer = document.createElement("div");
  layer.className = "about-entrance";
  layer.setAttribute("aria-hidden", "true");
  const photo = document.createElement("img");
  photo.src = src;
  photo.alt = "";
  layer.append(photo);
  document.body.append(layer);

  const settle = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    layer.dataset.reveal = "";
    const animation = photo.animate(
      [
        { left: "0px", top: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: "0px", objectPosition: "44% 30%" },
        { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: "16px", objectPosition: "44% 50%" },
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
