"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };
type View = "before" | "after";

// As-is / To-be as one frame with a segmented toggle. When the block scrolls
// into view it plays As-is → To-be once (1.4s), then the toggle is yours; the
// screens and the caption crossfade (400ms). Reduced motion starts on To-be.
export function DevsignCompare({ before, after, labels }: { before: Side; after: Side; labels: { asIs: string; toBe: string; compare: string } }) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("before");
  const played = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { played.current = true; timer = setTimeout(() => setView("after"), 0); return () => clearTimeout(timer); }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || played.current) return;
      played.current = true;
      timer = setTimeout(() => setView("after"), 1400);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, []);

  const sides: { key: View; label: string; side: Side }[] = [
    { key: "before", label: labels.asIs, side: before },
    { key: "after", label: labels.toBe, side: after },
  ];

  return (
    <figure ref={root} className="dv-toggle reveal" data-view={view}>
      <div className="dv-toggle-head">
        <div role="tablist" aria-label={labels.compare} className="dv-toggle-tabs">
          {sides.map(({ key, label }) => (
            <button key={key} type="button" role="tab" id={`${id}-${key}`} aria-selected={view === key} aria-controls={`${id}-panel`} tabIndex={view === key ? 0 : -1} className="press dv-toggle-tab" onClick={() => setView(key)} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") setView(key === "before" ? "after" : "before"); }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${view}`} className="dv-toggle-frame">
        {sides.map(({ key, side }) => (
          <Image key={key} src={withBase(side.src)} alt={side.alt} width={960} height={540} sizes="(max-width: 767px) 100vw, 80vw" data-side={key} aria-hidden={view !== key} />
        ))}
      </div>
      <figcaption className="dv-toggle-caption">
        {sides.map(({ key, label, side }) => (
          <span key={key} data-side={key} aria-hidden={view !== key}>
            <span className="dv-compare-label">{label}</span>
            <span className="dv-compare-text">{side.lead && <em>{side.lead}</em>}{side.text}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
