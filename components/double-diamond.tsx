"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";

export type DiamondStage = { name: string; outcome?: string; methods?: string[]; current?: boolean };

const HALVES = ["M0 167L300 0V334Z", "M300 0L600 167L300 334Z", "M600 167L900 0V334Z", "M900 0L1200 167L900 334Z"];

// The Double Diamond, kept simple: two outlined diamonds that draw in on reveal,
// the stage names inside them and one outcome under each. Only the stage marked
// `current` and its `pivot` (where the direction changed) carry the case colour.
// Each stage links to its section. On hover or keyboard focus its name crossfades
// to its methods, in the same spot inside the diamond; touch and narrow screens
// list them under the outcome instead. Shared by the Devsign body and CaseDiamond.
// Scrolling moves it through the stages (owner: step with the scroll, not a timer): as the
// diagram's middle travels from 78% to 28% of the screen height, each stage in turn shows
// its methods and tints its half. Native scroll only, no pin. Hover or focus takes over.
const SCROLL_FROM = 0.78;
const SCROLL_TO = 0.28;

export function DoubleDiamond({ stages, pivot }: { stages: DiamondStage[]; pivot?: string }) {
  const [from, to] = pivot?.split(" → ") ?? [];
  const root = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(-1);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.height / 2) / window.innerHeight;
      if (mid > SCROLL_FROM + 0.12 || mid < SCROLL_TO - 0.3) { setShown(-1); return; }
      const t = Math.min(Math.max((SCROLL_FROM - mid) / (SCROLL_FROM - SCROLL_TO), 0), 0.999);
      setShown(Math.floor(t * stages.length));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [stages.length]);
  return (
    <figure ref={root} className="dv-dd reveal" data-held={held || undefined} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="dv-dd-body">
        <svg className="dv-dd-lines" viewBox="0 0 1200 334" fill="none" aria-hidden="true">
          {HALVES.map((d, i) => <path key={d} className="dv-dd-half" d={d} data-current={stages[i]?.current || undefined} data-show={(!held && shown === i) || undefined} />)}
          <path className="dv-dd-line" pathLength={1} d="M1 167L300 1L599 167L300 333Z" />
          <path className="dv-dd-line" pathLength={1} d="M601 167L900 1L1199 167L900 333Z" />
        </svg>
        <ol className="dv-dd-stages">
          {stages.map((stage) => (
            <li key={stage.name} data-current={stage.current || undefined} data-show={(!held && shown === stages.indexOf(stage)) || undefined}>
              <a href={`#${stage.name.toLowerCase()}`}>
                <span className="dv-dd-name"><span>{stage.name}</span></span>
                {stage.outcome && <span className="dv-dd-outcome">{stage.outcome}</span>}
                {stage.current && pivot && <span className="dv-dd-pivot">{from}{to && <><ArrowIcon size={14} />{to}</>}</span>}
                {stage.methods && <span className="dv-dd-methods">{stage.methods.map((m) => <span key={m}>{m}</span>)}</span>}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
