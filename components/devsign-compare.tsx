"use client";

import Image from "next/image";
import { useState } from "react";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };

// As-is / To-be on one frame: drag the divider (or use the arrow keys on the
// range control that covers the frame) to compare. Captions sit below.
export function DevsignCompare({ before, after, labels }: { before: Side; after: Side; labels: { asIs: string; toBe: string; compare: string } }) {
  const [position, setPosition] = useState(50);
  return (
    <figure className="dv-slider reveal" style={{ "--dv-split": `${position}%` } as React.CSSProperties}>
      <div className="dv-slider-frame">
        <Image src={withBase(after.src)} alt={after.alt} width={960} height={540} sizes="(max-width: 767px) 100vw, 80vw" />
        <div className="dv-slider-before">
          <Image src={withBase(before.src)} alt={before.alt} width={960} height={540} sizes="(max-width: 767px) 100vw, 80vw" />
        </div>
        <span className="dv-slider-chip" data-side="before" aria-hidden="true">{labels.asIs}</span>
        <span className="dv-slider-chip" data-side="after" aria-hidden="true">{labels.toBe}</span>
        <span className="dv-slider-divider" aria-hidden="true"><span>‹ ›</span></span>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={labels.compare}
          aria-valuetext={`${labels.asIs} ${position}%`}
        />
      </div>
      <figcaption className="dv-compare">
        <span className="dv-compare-item" data-before="">
          <span className="dv-compare-label">{labels.asIs}</span>
          <span className="dv-compare-text">{before.text}</span>
        </span>
        <span className="dv-compare-item">
          <span className="dv-compare-label">{labels.toBe}</span>
          <span className="dv-compare-text">{after.lead && <em>{after.lead}</em>}{after.text}</span>
        </span>
      </figcaption>
    </figure>
  );
}
