"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AboutClip } from "@/components/about-clip";

export type OutsideItem = { name: string; col: string; row: string; caption: string; clip?: boolean; pos?: string; d?: number };

// Outside work: photos set loosely with a small caption under each. Pressing one grows it
// where it is (no overlay): it scales up over its neighbours, nudged only as far as needed to
// stay on screen, while the other photos fade back. Pressing it again, pressing elsewhere,
// Esc or scrolling on lets it settle back.
export function OutsideGallery({ items, alts, base, labels }: { items: OutsideItem[]; alts: Record<string, string>; base: string; labels: { open: string; close: string } }) {
  const [at, setAt] = useState<number | null>(null);
  const [zoom, setZoom] = useState("");
  const figs = useRef<(HTMLElement | null)[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const src = (name: string, ext: string) => `${base}/images/about/outside/${name}${ext}`;

  const toggle = (i: number) => {
    if (at === i) return setAt(null);
    const f = figs.current[i];
    if (!f) return;
    // Measure without the current transform: the box as laid out (drift included).
    const r = f.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight, m = 24;
    const k = Math.max(1.3, Math.min(2.4, (vh * 0.8) / r.height, (Math.min(vw, 1440) * 0.55) / r.width));
    const w = r.width * k, h = r.height * k;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    // Keep the grown photo inside the screen: shift its centre only as much as needed.
    const nx = Math.min(Math.max(cx, m + w / 2), vw - m - w / 2);
    const ny = Math.min(Math.max(cy, 72 + h / 2), vh - m - h / 2);
    setZoom(`translate(${Math.round(nx - cx)}px, ${Math.round(ny - cy)}px) scale(${k.toFixed(3)})`);
    setAt(i);
  };

  useEffect(() => {
    if (at === null) return;
    const y0 = window.scrollY;
    const off = (e: PointerEvent) => { if (!figs.current[at]?.contains(e.target as Node)) setAt(null); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setAt(null); figs.current[at]?.querySelector<HTMLButtonElement>("button")?.focus(); } };
    const scroll = () => { if (Math.abs(window.scrollY - y0) > 48) setAt(null); };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", key); window.removeEventListener("scroll", scroll); };
  }, [at]);

  return (
    <div ref={grid} className="about-outside-grid" data-zoomed={at !== null || undefined}>
      {items.map((p, i) => (
        <figure key={p.name} ref={(n) => { figs.current[i] = n; }} className="about-outside-item" data-open={at === i || undefined} style={{ gridColumn: p.col, gridRow: p.row, ["--d" as string]: `${p.d ?? 0}px`, ...(at === i ? { transform: zoom } : null) }}>
          <div className="about-outside-media">
            {p.clip ? (
              <AboutClip src={src(p.name, ".mp4")} poster={src(p.name, "-poster.webp")} label={alts[p.name]} />
            ) : (
              <Image src={src(p.name, ".webp")} alt={alts[p.name]} fill sizes="(min-width: 64rem) 50vw, 90vw" style={{ objectPosition: p.pos }} />
            )}
            <button type="button" className="about-outside-open" aria-expanded={at === i} aria-label={`${at === i ? labels.close : labels.open}: ${p.caption}`} onClick={() => toggle(i)} />
          </div>
          <figcaption>{p.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
