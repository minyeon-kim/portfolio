"use client";

import { useEffect, useRef } from "react";
import { playClip, toggleClip } from "@/lib/video";

// A short muted loop on the About page: plays while half of it is on screen, pauses
// otherwise. With reduced motion it waits on its poster until pressed.
export function AboutClip({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? playClip(v) : v.pause()), { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} onClick={toggleClip} />;
}
