// Entering About from the landing: the dust gathers into the portrait (HeroObject,
// variant "portrait"), then the real photo fades in over it at the exact spot it
// takes on the About page, the page swaps in underneath, and everything round
// the photo clears. About 1.4s; a click or key press skips the gathering.

export type Box = { left: number; top: number; width: number; height: number };

// Where the About opener puts the portrait (desktop): see .about-hero-portrait.
export function portraitBox(): Box {
  const vw = document.documentElement.clientWidth;
  const height = Math.min(window.innerHeight - 112, 760);
  const width = height * 0.8;
  return { left: vw - Math.max(56, (vw - 1200) / 2) - width, top: 88, width, height };
}

const GATHER = 850, FADE = 260, REVEAL = 380;

export function enterAbout(box: Box, src: string, go: () => void, ready: () => boolean) {
  const root = document.documentElement;
  const layer = document.createElement("div");
  layer.className = "about-entrance";
  layer.setAttribute("aria-hidden", "true");
  const photo = document.createElement("img");
  photo.src = src;
  photo.alt = "";
  Object.assign(photo.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  layer.append(photo);
  document.body.append(layer);

  const finish = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    layer.dataset.reveal = "";
    window.setTimeout(() => {
      layer.remove();
      root.removeAttribute("data-project-navigation");
    }, REVEAL);
  };
  const swap = () => {
    root.setAttribute("data-project-navigation", "");
    go();
    const started = performance.now();
    const wait = () => {
      if (ready() || performance.now() - started > 4000) requestAnimationFrame(finish);
      else requestAnimationFrame(wait);
    };
    wait();
  };
  let timer = 0;
  const showPhoto = () => {
    window.clearTimeout(timer);
    window.removeEventListener("pointerdown", showPhoto, true);
    window.removeEventListener("keydown", showPhoto, true);
    layer.dataset.photo = "";
    window.setTimeout(swap, FADE);
  };
  timer = window.setTimeout(showPhoto, GATHER);
  window.addEventListener("pointerdown", showPhoto, true);
  window.addEventListener("keydown", showPhoto, true);
}
