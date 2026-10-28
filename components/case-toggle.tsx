"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { withBase } from "@/lib/site";

// Box on the screenshot in percent of its width and height: [x, y, w, h].
type Box = [number, number, number, number];
type Shot = { src: string; alt: string; caption: string };
type Change = { title: string; before: string; after: string; a?: Box; b?: Box };

// One frame that switches between the old and new screen. Layouts differ between
// versions, so a wipe slider would mix two unrelated halves; a toggle keeps each
// screen whole and the numbered boxes point at what changed.
export function CaseToggle({ before, after, width, height, changes, labels = ["Before", "After"] }: { before: Shot; after: Shot; width: number; height: number; changes: Change[]; labels?: [string, string] }) {
  const [view, setView] = useState<0 | 1>(1);
  const [focus, setFocus] = useState<number | null>(null);
  const shots = [before, after];
  return (
    <figure className="case-toggle reveal" data-view={view}>
      <div className="case-toggle-switch" role="tablist" aria-label={`${labels[0]} / ${labels[1]}`}>
        {labels.map((l, i) => (
          <button key={l} type="button" role="tab" aria-selected={view === i} onClick={() => setView(i as 0 | 1)}>{l}</button>
        ))}
      </div>
      <div className="case-toggle-stage" style={{ aspectRatio: `${width} / ${height}` }}>
        {shots.map((s, i) => (
          <div key={s.src} className="case-toggle-shot" aria-hidden={view !== i}>
            <Image src={withBase(s.src)} alt={s.alt} width={width} height={height} sizes="(max-width: 767px) 100vw, 880px" />
            {changes.map((c, n) => {
              const box = i === 0 ? c.a : c.b;
              if (!box) return null;
              return (
                <span key={n} className="case-toggle-box" data-focus={focus === n || undefined} style={{ "--x": `${box[0]}%`, "--y": `${box[1]}%`, "--w": `${box[2]}%`, "--h": `${box[3]}%`, "--i": n } as CSSProperties}>
                  <b>{n + 1}</b>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <figcaption className="case-toggle-caption">{shots[view].caption}</figcaption>
      <ol className="case-toggle-list">
        {changes.map((c, n) => (
          <li key={n} onMouseEnter={() => setFocus(n)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(n)} onBlur={() => setFocus(null)} tabIndex={0}>
            <b aria-hidden="true">{n + 1}</b>
            <strong>{c.title}</strong>
            <span data-active={view === 0 || undefined}>{labels[0]} · {c.before}</span>
            <span data-active={view === 1 || undefined}>{labels[1]} · {c.after}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
