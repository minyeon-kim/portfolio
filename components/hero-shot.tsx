"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { withBase } from "@/lib/site";

// A photographed mockup with the product playing on its screen (after metalab.com's case
// covers): the scene is a still image whose screen is cut out (transparent), and the live
// media sits under it, warped onto the screen with a matrix3d computed from the image's
// own screen corners. Everything is laid out at the image's pixel size and scaled to
// the cover's width, so the warp stays exact at any width.
// Without a matrix the scene is a film still with its screens already in the picture;
// `film` (the playing film) lies over it, in the same box, so crops apply to both.
export function HeroShot({ src, width, height, alt, matrix, mediaWidth, mediaHeight, crop, cropPhone, full, fullPhone, shadow, film, children }: {
  src: string; width: number; height: number; alt: string; matrix?: string; mediaWidth?: number; mediaHeight?: number; crop?: [number, number, number, number]; cropPhone?: [number, number, number, number]; full?: [number, number, number, number]; fullPhone?: [number, number, number, number]; shadow?: { src: string; x: number; y: number; w: number; h: number }; film?: ReactNode; children?: ReactNode;
}) {
  // crop = [x, y, w, h] in image pixels: the part of the scene the cover shows.
  const [cx, cy, cw, ch] = crop ?? [0, 0, width, height];
  const [px, py, pw, ph] = cropPhone ?? [cx, cy, cw, ch];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const phone = matchMedia("(max-width: 47.99rem)");
    const set = () => box.style.setProperty("--shot-k", String(box.clientWidth / (phone.matches ? pw : cw)));
    set();
    const watch = new ResizeObserver(set);
    watch.observe(box);
    phone.addEventListener("change", set);
    return () => { watch.disconnect(); phone.removeEventListener("change", set); };
  }, [cw, pw]);
  return (
    <div ref={ref} className="dh-shot" data-film={matrix ? undefined : ""} data-full={full?.join(",")} data-full-phone={fullPhone?.join(",")} style={{ "--shot-a": `${cw} / ${ch}`, "--shot-a-p": `${pw} / ${ph}`, "--shot-x": `${-cx}px`, "--shot-y": `${-cy}px`, "--shot-x-p": `${-px}px`, "--shot-y-p": `${-py}px` } as CSSProperties}>
      <div className="dh-shot-camera">
        <div className="dh-shot-stage" style={{ width, height }}>
          {matrix && <div className="dh-shot-media" style={{ width: mediaWidth, height: mediaHeight, transform: matrix }}>{children}</div>}
          {/* The shadow the hand casts on the screen: above the recording, under the hand. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shadow && <img className="dh-shot-shadow" src={withBase(shadow.src)} alt="" decoding="async" style={{ left: shadow.x, top: shadow.y, width: shadow.w, height: shadow.h }} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dh-shot-scene" src={src} width={width} height={height} alt={alt} decoding="async" />
          {film}
        </div>
      </div>
    </div>
  );
}
