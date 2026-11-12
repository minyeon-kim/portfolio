"use client";

import { useEffect, useRef, useState } from "react";
import { playClip, toggleClip } from "@/lib/video";

// The film on the Devsign cover (after Figma's Config India launch film: chapter cards over
// flickering code, the real prototype on a grey canvas, a recap, the logo). It lies over a
// still taken from its own frame at `start`, and starts playing from that frame, so the
// cover never jumps: the landing card and the zoom from the landing settle onto that still,
// then the film fades in and carries on, looping from its first card afterwards. It fades in
// only once it can play and no page transition is running. Muted, playing only while on
// screen; pressing it pauses. Phones get the 720p file. With reduced motion it never loads.
export function HeroFilm({ src, small, start = 0, label }: { src: string; small?: string; start?: number; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    video.preload = "auto";
    video.src = small && matchMedia("(max-width: 47.99rem)").matches ? small : src;
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
    const watch = new MutationObserver(check);
    watch.observe(html, { attributes: true, attributeFilter: ["data-project-navigation"] });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { if (shown) playClip(video); }
      else video.pause();
    }, { threshold: 0.2 });
    seen.observe(video);
    video.load();
    return () => { video.removeEventListener("loadedmetadata", onMeta); video.removeEventListener("canplay", onCanPlay); watch.disconnect(); seen.disconnect(); window.clearTimeout(timer); };
  }, [src, small, start]);
  return (
    <span className="dh-film" data-ready={ready || undefined}>
      <video ref={ref} muted loop playsInline preload="none" aria-label={label} onClick={toggleClip} />
    </span>
  );
}
