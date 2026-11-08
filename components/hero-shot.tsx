"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A photographed mockup with the product playing on its screen (after metalab.com's case
// covers): the scene is a still image whose screen is cut out (transparent), and the live
// media sits under it, warped onto the screen with a matrix3d computed from the image's
// own screen corners. Everything is laid out at the image's pixel size and scaled to
// the cover's width, so the warp stays exact at any width.
export function HeroShot({ src, width, height, alt, matrix, mediaWidth, mediaHeight, children }: {
  src: string; width: number; height: number; alt: string; matrix: string; mediaWidth: number; mediaHeight: number; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const set = () => box.style.setProperty("--shot-k", String(box.clientWidth / width));
    set();
    const watch = new ResizeObserver(set);
    watch.observe(box);
    return () => watch.disconnect();
  }, [width]);
  return (
    <div ref={ref} className="dh-shot" style={{ aspectRatio: `${width} / ${height}` }}>
      <div className="dh-shot-stage" style={{ width, height }}>
        <div className="dh-shot-media" style={{ width: mediaWidth, height: mediaHeight, transform: matrix }}>{children}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dh-shot-scene" src={src} width={width} height={height} alt={alt} decoding="async" />
      </div>
    </div>
  );
}
