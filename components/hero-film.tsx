"use client";

import { useEffect, useRef, useState } from "react";
import { pickFilm, playClip, toggleClip } from "@/lib/video";

// The film on the Devsign cover (structure after Figma's Config India launch film: chapter
// cards on the prototype's dot-grid canvas, the real prototype on a purple-lit canvas with its
// own multiplayer cursors, a recap, the four screens closing up into the logo). It lies over a
// still taken from its own frame at `start`, and starts playing from that frame, so the
// cover never jumps: the landing card and the zoom from the landing settle onto that still,
// then the film fades in and carries on, looping from its first card afterwards. It fades in
// only once it can play and no page transition is running. Muted, playing only while on
// screen; pressing it pauses. The file follows the screen (pickFilm). With reduced motion it
// never loads.
// Opened from the landing or the Menu on a large screen, the film first plays full screen in
// the zoom layer and shrinks into place; the layer then hands over its moment
// ("hero-film-handoff": time, done) and this film carries on from that exact frame, shown at
// once, so the layer can go without a jump.
export function HeroFilm({ src, small, large, start = 0, label }: { src: string; small?: string; large?: string; start?: number; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [instant, setInstant] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    video.preload = "auto";
    video.src = pickFilm({ src, small, large });
    let canPlay = false;
    let timer = 0;
    let shown = false;
    let visible = false;
    const check = () => {
      if (!canPlay || html.hasAttribute("data-project-navigation")) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { shown = true; setReady(true); if (visible) playClip(video); }, 300);
    };
    const onCanPlay = () => { canPlay = true; check(); };
    const onMeta = () => { if (start) video.currentTime = start; };
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("canplay", onCanPlay, { once: true });
    const onHandoff = (event: Event) => {
      const { time, done } = (event as CustomEvent<{ time: number; done: () => void }>).detail;
      const go = () => {
        const seeked = () => {
          video.removeEventListener("seeked", seeked);
          shown = true;
          setInstant(true);
          setReady(true);
          requestAnimationFrame(() => requestAnimationFrame(() => { playClip(video); done(); }));
        };
        video.addEventListener("seeked", seeked);
        video.currentTime = time;
      };
      if (video.readyState >= 1) go();
      else video.addEventListener("loadedmetadata", go, { once: true });
    };
    window.addEventListener("hero-film-handoff", onHandoff);
    const watch = new MutationObserver(check);
    watch.observe(html, { attributes: true, attributeFilter: ["data-project-navigation"] });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { if (shown) playClip(video); }
      else video.pause();
    }, { threshold: 0.2 });
    seen.observe(video);
    video.load();
    return () => { window.removeEventListener("hero-film-handoff", onHandoff); video.removeEventListener("loadedmetadata", onMeta); video.removeEventListener("canplay", onCanPlay); watch.disconnect(); seen.disconnect(); window.clearTimeout(timer); };
  }, [src, small, large, start]);
  return (
    <span className="dh-film" data-ready={ready || undefined} data-instant={instant || undefined}>
      <video ref={ref} muted loop playsInline preload="none" aria-label={label} onClick={toggleClip} />
    </span>
  );
}
