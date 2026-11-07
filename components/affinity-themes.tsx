"use client";

import { useState } from "react";

export type AffinityTheme = { name: string; count: number; short: string; out?: string };
type Board = { src: string; width: number; height: number; alt: string; open: string };

// The real affinity board beside its themes (Gemini: the board runs in rows, one per theme).
// The board image stays still; pointing at or focusing a theme dims the board except that
// theme's row (`rows` are [top, height] in % of the image). Below 64rem it stacks.
export function AffinityThemes({ board, rows, themes, label }: { board: Board; rows: [number, number][]; themes: AffinityTheme[]; label: string }) {
  const [on, setOn] = useState<number | null>(null);
  return (
    <div className="dv-axt dv-gap-40">
      <a className="dv-axt-board reveal" href={board.src} target="_blank" rel="noreferrer" data-lit={on !== null || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={board.src} width={board.width} height={board.height} loading="lazy" decoding="async" alt={board.alt} />
        {rows.map(([top, h], i) => (
          <i key={i} className="dv-axt-row" data-on={on === i || undefined} style={{ top: `${top}%`, height: `${h}%` }} aria-hidden />
        ))}
        <span className="dv-open-hint" aria-hidden>{board.open}</span>
      </a>
      <ol className="dv-axt-list" aria-label={label}>
        {themes.map((t, i) => (
          <li key={t.name} className="reveal" tabIndex={0} data-on={on === i || undefined} data-out={t.out ? "" : undefined} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
            <p className="dv-axe-name"><b>{t.name}</b><span>{t.count}</span></p>
            <p className="dv-axe-short">{t.short}</p>
            {t.out && <p className="dv-axe-out">{t.out}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
