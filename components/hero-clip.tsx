"use client";

import { useEffect, useRef, useState } from "react";
import { playClip, toggleClip } from "@/lib/video";

// A real prototype recording on the case cover (after metalab.com's case heroes, where
// the product plays in the cover). It lies over the opener's own loop and fades in only
// once it can play and no page transition is running, because the zoom from the landing
// settles into that loop. Plays muted and looped while on screen; pressing it pauses.
// With reduced motion it never shows, and the loop's still picture stays.
export function HeroClip({ src, poster, label, phone }: { src: string; poster: string; label: string; phone?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const html = document.documentElement;
    let canPlay = video.readyState >= 3;
    let timer = 0;
    let shown = false;
    const check = () => {
      if (!canPlay || html.hasAttribute("data-project-navigation")) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { shown = true; setReady(true); playClip(video); }, 300);
    };
    const onCanPlay = () => { canPlay = true; check(); };
    video.addEventListener("canplay", onCanPlay);
    const watch = new MutationObserver(check);
    watch.observe(html, { attributes: true, attributeFilter: ["data-project-navigation"] });
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { if (shown) playClip(video); }
      else video.pause();
    }, { threshold: 0.2 });
    seen.observe(video);
    video.load();
    check();
    return () => { video.removeEventListener("canplay", onCanPlay); watch.disconnect(); seen.disconnect(); window.clearTimeout(timer); };
  }, []);
  return (
    <span className="dh-clip" data-ready={ready || undefined} data-phone={phone || undefined}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} onClick={toggleClip} />
    </span>
  );
}
