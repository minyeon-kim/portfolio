"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AboutClip } from "@/components/about-clip";

export type OutsideItem = { name: string; col: string; row: string; caption: string; clip?: boolean; pos?: string; d?: number };

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const GROW = 500;
type Box = { left: number; top: number; width: number; height: number };
const boxOf = (r: DOMRect): Box => ({ left: r.left, top: r.top, width: r.width, height: r.height });

// Outside work: photos set loosely with a small caption under each. Pressing one lifts it
// from its place and grows it to the middle of the screen while the page dims behind it
// (no separate screen); pressing anywhere or Esc shrinks it back into its spot. The photo
// is a copy in a native <dialog>, so focus stays with it and returns to the photo after.
export function OutsideGallery({ items, alts, base, labels }: { items: OutsideItem[]; alts: Record<string, string>; base: string; labels: { open: string; close: string } }) {
  const [at, setAt] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const from = useRef<Box | null>(null);
  const busy = useRef(false);
  const src = (name: string, ext: string) => `${base}/images/about/outside/${name}${ext}`;
  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Where the photo lands: its own shape, as large as fits with room for the caption.
  const target = (tile: HTMLDivElement): Box => {
    const media = tile.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    const w0 = media instanceof HTMLVideoElement ? media.videoWidth || 900 : media?.naturalWidth || 3;
    const h0 = media instanceof HTMLVideoElement ? media.videoHeight || 1200 : media?.naturalHeight || 4;
    const maxW = Math.min(1100, window.innerWidth - 64), maxH = window.innerHeight - 160;
    const s = Math.min(maxW / w0, maxH / h0);
    const width = w0 * s, height = h0 * s;
    return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2 - 16, width, height };
  };

  const open = (i: number) => {
    const tile = tiles.current[i];
    if (!tile || busy.current) return;
    from.current = boxOf(tile.getBoundingClientRect());
    setAt(i);
    dialog.current?.showModal();
  };

  // After the copy renders: start it exactly on the tile, hide the tile, grow to the target.
  useLayoutEffect(() => {
    if (at === null) return;
    const tile = tiles.current[at], el = layer.current, a = from.current;
    if (!tile || !el || !a) return;
    const b = target(tile);
    Object.assign(el.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    tile.style.visibility = "hidden";
    if (still()) return;
    busy.current = true;
    const px = (o: Box) => ({ left: `${o.left}px`, top: `${o.top}px`, width: `${o.width}px`, height: `${o.height}px` });
    el.animate([px(a), px(b)], { duration: GROW, easing: EASE }).finished.finally(() => { busy.current = false; });
    dialog.current?.animate([{ backgroundColor: "rgb(8 8 10 / 0)" }, { backgroundColor: "rgb(8 8 10 / 0.86)" }], { duration: GROW, easing: EASE, fill: "both" });
  }, [at]);

  const close = useCallback(() => {
    if (at === null || busy.current) return;
    const tile = tiles.current[at], el = layer.current, d = dialog.current;
    const done = () => { if (tile) tile.style.visibility = ""; d?.getAnimations().forEach((x) => x.cancel()); d?.close(); setAt(null); tile?.querySelector<HTMLButtonElement>(".about-outside-open")?.focus({ preventScroll: true }); busy.current = false; };
    if (!tile || !el || still()) return done();
    busy.current = true;
    el.dataset.closing = "";
    // The tile may have drifted with the scroll: shrink back to where it is now.
    const b = boxOf(tile.getBoundingClientRect()), r = el.getBoundingClientRect();
    const px = (o: Box) => ({ left: `${o.left}px`, top: `${o.top}px`, width: `${o.width}px`, height: `${o.height}px` });
    d?.animate([{ backgroundColor: "rgb(8 8 10 / 0.86)" }, { backgroundColor: "rgb(8 8 10 / 0)" }], { duration: 400, easing: EASE, fill: "both" });
    el.animate([px(boxOf(r)), px(b)], { duration: 400, easing: EASE, fill: "both" }).finished.then(done, done);
  }, [at]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); close(); };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [close]);

  const cur = at === null ? null : items[at];
  return (
    <>
      <div className="about-outside-grid">
        {items.map((p, i) => (
          <figure key={p.name} className="about-outside-item" style={{ gridColumn: p.col, gridRow: p.row, ["--d" as string]: `${p.d ?? 0}px` }}>
            <div className="about-outside-media" ref={(n) => { tiles.current[i] = n; }}>
              {p.clip ? (
                <AboutClip src={src(p.name, ".mp4")} poster={src(p.name, "-poster.webp")} label={alts[p.name]} />
              ) : (
                <Image src={src(p.name, ".webp")} alt={alts[p.name]} fill sizes="(min-width: 64rem) 34vw, 50vw" style={{ objectPosition: p.pos }} />
              )}
              <button type="button" className="about-outside-open" aria-label={`${labels.open}: ${p.caption}`} onClick={() => open(i)} />
            </div>
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
      <dialog ref={dialog} className="about-zoom" aria-label={cur?.caption} onClick={close}>
        {cur && (
          <>
            <div ref={layer} className="about-zoom-photo">
              {cur.clip ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={src(cur.name, ".mp4")} poster={src(cur.name, "-poster.webp")} muted loop playsInline autoPlay aria-label={alts[cur.name]} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src(cur.name, ".webp")} alt={alts[cur.name]} style={{ objectPosition: cur.pos }} />
              )}
              <p className="about-zoom-caption">{cur.caption}</p>
            </div>
            <button type="button" className="sr-only" onClick={close}>{labels.close}</button>
          </>
        )}
      </dialog>
    </>
  );
}
