"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A photographed mockup with the product playing on its screen (after metalab.com's case
// covers): the scene is a still image whose screen is cut out (transparent), and the live
// media sits under it, warped onto the screen with a matrix3d computed from the image's
// own screen corners. Everything is laid out at the image's pixel size and scaled to
// the cover's width, so the warp stays exact at any width.
export function HeroShot({ src, width, height, alt, matrix, mediaWidth, mediaHeight, crop, children }: {
  src: string; width: number; height: number; alt: string; matrix: string; mediaWidth: number; mediaHeight: number; crop?: [number, number, number, number]; children: ReactNode;
}) {
  // crop = [x, y, w, h] in image pixels: the part of the scene the cover shows.
  const [cx, cy, cw, ch] = crop ?? [0, 0, width, height];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const set = () => box.style.setProperty("--shot-k", String(box.clientWidth / cw));
    set();
    const watch = new ResizeObserver(set);
    watch.observe(box);
    return () => watch.disconnect();
  }, [cw]);
  return (
    <div ref={ref} className="dh-shot" style={{ aspectRatio: `${cw} / ${ch}` }}>
      <div className="dh-shot-stage" style={{ width, height, translate: `calc(${-cx}px * var(--shot-k, 1)) calc(${-cy}px * var(--shot-k, 1))` }}>
        <div className="dh-shot-media" style={{ width: mediaWidth, height: mediaHeight, transform: matrix }}>{children}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dh-shot-scene" src={src} width={width} height={height} alt={alt} decoding="async" />
      </div>
    </div>
  );
}
