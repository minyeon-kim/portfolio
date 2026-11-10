"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AboutClip } from "@/components/about-clip";

export type OutsideItem = { name: string; col: string; row: string; caption: string; clip?: boolean; pos?: string; d?: number };

// Outside work: photos set loosely; pointing at one shows its caption, pressing it opens it
// large over the page (a native <dialog>: arrows step through, Esc, the X or the backdrop
// close it, focus goes back to the photo). The clip plays large too.
export function OutsideGallery({ items, alts, base, labels }: { items: OutsideItem[]; alts: Record<string, string>; base: string; labels: { open: string; close: string; prev: string; next: string } }) {
  const [at, setAt] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const src = (name: string, ext: string) => `${base}/images/about/outside/${name}${ext}`;

  const open = (i: number, el: HTMLButtonElement) => {
    opener.current = el;
    setAt(i);
    dialog.current?.showModal();
  };
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((by: number) => setAt((i) => (i === null ? i : (i + by + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => { setAt(null); opener.current?.focus({ preventScroll: true }); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    };
    d.addEventListener("close", onClose);
    d.addEventListener("keydown", onKey);
    return () => { d.removeEventListener("close", onClose); d.removeEventListener("keydown", onKey); };
  }, [step]);

  const cur = at === null ? null : items[at];
  return (
    <>
      <div className="about-outside-grid">
        {items.map((p, i) => (
          <figure key={p.name} className="about-outside-item" style={{ gridColumn: p.col, gridRow: p.row, ["--d" as string]: `${p.d ?? 0}px` }}>
            <div className="about-outside-media">
              {p.clip ? (
                <AboutClip src={src(p.name, ".mp4")} poster={src(p.name, "-poster.webp")} label={alts[p.name]} />
              ) : (
                <Image src={src(p.name, ".webp")} alt={alts[p.name]} fill sizes="(min-width: 64rem) 34vw, 50vw" style={{ objectPosition: p.pos }} />
              )}
              <button type="button" className="about-outside-open" aria-label={`${labels.open}: ${p.caption}`} onClick={(e) => open(i, e.currentTarget)} />
              <figcaption>{p.caption}</figcaption>
            </div>
          </figure>
        ))}
      </div>
      <dialog ref={dialog} className="about-lightbox" aria-label={cur?.caption} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        {cur && (
          <figure key={cur.name} className="about-lightbox-figure">
            {cur.clip ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={src(cur.name, ".mp4")} poster={src(cur.name, "-poster.webp")} muted loop playsInline autoPlay aria-label={alts[cur.name]} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src(cur.name, ".webp")} alt={alts[cur.name]} />
            )}
            <figcaption>{cur.caption}<span>{(at ?? 0) + 1} / {items.length}</span></figcaption>
          </figure>
        )}
        <button type="button" className="about-lightbox-btn" data-at="close" aria-label={labels.close} onClick={close}>×</button>
        <button type="button" className="about-lightbox-btn" data-at="prev" aria-label={labels.prev} onClick={() => step(-1)}>←</button>
        <button type="button" className="about-lightbox-btn" data-at="next" aria-label={labels.next} onClick={() => step(1)}>→</button>
      </dialog>
    </>
  );
}
