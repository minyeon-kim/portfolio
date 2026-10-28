"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };
// Box on the screenshot in percent of its width and height: [x, y, w, h].
type Box = [number, number, number, number];
type Change = { title: string; before: string; after: string; a?: Box; b?: Box };

// As-is / To-be in one dark browser window (the opener's framing), switched
// with a toggle. The two layouts differ, so a wipe would mix unrelated halves;
// each screen stays whole, crossfades, and numbered boxes mark what changed.
// Hovering or focusing a change in the list below emphasises its box.
export function DevsignCompare({ before, after, changes = [], labels }: { before: Side; after: Side; changes?: Change[]; labels: { asIs: string; toBe: string; compare: string } }) {
  const [view, setView] = useState<0 | 1>(1);
  const [focus, setFocus] = useState<number | null>(null);
  const sides = [
    { key: "before" as const, label: labels.asIs, side: before },
    { key: "after" as const, label: labels.toBe, side: after },
  ];
  const current = sides[view];
  return (
    <figure className="dv-toggle reveal" data-view={current.key}>
      <div className="dv-toggle-switch" role="tablist" aria-label={labels.compare}>
        {sides.map(({ key, label }, i) => (
          <button key={key} type="button" role="tab" aria-selected={view === i} onClick={() => setView(i as 0 | 1)}>{label}</button>
        ))}
      </div>
      <div className="dv-wipe-window">
        <div className="dv-wipe-chrome" aria-hidden="true"><span /><span /><span /><i /></div>
        <div className="dv-toggle-frame">
          {sides.map(({ key, side }, i) => (
            <div key={key} className="dv-toggle-shot" aria-hidden={view !== i}>
              <Image src={withBase(side.src)} alt={side.alt} width={960} height={540} sizes="(max-width: 767px) 100vw, 90vw" />
              {changes.map((c, n) => {
                const box = key === "before" ? c.a : c.b;
                if (!box) return null;
                return (
                  <span key={n} className="dv-toggle-box" data-focus={focus === n || undefined} style={{ "--x": `${box[0]}%`, "--y": `${box[1]}%`, "--w": `${box[2]}%`, "--h": `${box[3]}%`, "--i": n } as CSSProperties}>
                    <b>{n + 1}</b>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="dv-toggle-caption">
        <span className="dv-compare-label">{current.label}</span>
        <span className="dv-compare-text">{current.side.lead && <em>{current.side.lead}</em>}{current.side.text}</span>
      </figcaption>
      {changes.length > 0 && (
        <ol className="dv-toggle-list" style={{ "--n": changes.length } as CSSProperties}>
          {changes.map((c, n) => (
            <li key={n} tabIndex={0} onMouseEnter={() => setFocus(n)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(n)} onBlur={() => setFocus(null)}>
              <b aria-hidden="true">{n + 1}</b>
              <strong>{c.title}</strong>
              <span data-active={view === 0 || undefined}>{labels.asIs} · {c.before}</span>
              <span data-active={view === 1 || undefined}>{labels.toBe} · {c.after}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
