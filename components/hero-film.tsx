"use client";

import { useEffect, useRef, useState } from "react";
import { playClip, toggleClip } from "@/lib/video";

// The film on a case cover (Devsign: two people's screens in a dim office, the prototype
// playing on the main monitor). It lies over its own first frame, which is the cover's
// still, and fades in only once it can play and no page transition is running, because
// the zoom from the landing settles onto that still. Muted, looped, playing only while on
// screen; pressing it pauses. Phones get the smaller file. With reduced motion it never
// loads, and the still stays.
export function HeroFilm({ src, small, label }: { src: string; small?: string; label: string }) {
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
    video.addEventListener("canplay", onCanPlay);
    const watch = new MutationObserver(check);
    watch.observe(html, { attributes: true, attributeFilter: ["data-project-navigation"] });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { if (shown) playClip(video); }
      else video.pause();
    }, { threshold: 0.2 });
    seen.observe(video);
    video.load();
    return () => { video.removeEventListener("canplay", onCanPlay); watch.disconnect(); seen.disconnect(); window.clearTimeout(timer); };
  }, [src, small]);
  return (
    <span className="dh-film" data-ready={ready || undefined}>
      <video ref={ref} muted loop playsInline preload="none" aria-label={label} onClick={toggleClip} />
    </span>
  );
}
