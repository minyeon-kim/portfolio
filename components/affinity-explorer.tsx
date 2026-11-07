"use client";

import { useState } from "react";
import { AFF_THEMES, AFF_PEOPLE, type Locale } from "@/lib/devsign-affinity";

// Where each theme's column sits on the real board image (affinity-board.webp, 7000 x 3022),
// as left / width in % of its width; the columns run in the same order as AFF_THEMES.
const COLS: [number, number][] = [
  [0.6, 13.7], [14.7, 13.6], [28.6, 13.7], [42.7, 13.6], [56.6, 13.7], [70.6, 14.2], [85.1, 14.3],
];

const UI = {
  ko: { list: "테마 7개", open: "크게 보기 ↗", count: "개" },
  en: { list: "Seven themes", open: "View full size ↗", count: "" },
};

// The affinity mapping as evidence, then what it found: the real FigJam board as one image
// (opens full size), and under it the seven themes as rows (name and count, the board's
// insight, one real statement). Pointing at a row lights its column on the board.
export function AffinityExplorer({ locale, boardHref }: { locale: Locale; boardHref: string }) {
  const ui = UI[locale];
  const [on, setOn] = useState<number | null>(null);
  const total = AFF_THEMES.reduce((sum, t) => sum + t.subs.reduce((s, x) => s + x.types.length, 0), 0);

  return (
    <div className="dv-axe dv-gap-40">
      <a className="dv-axe-board reveal" href={boardHref} target="_blank" rel="noreferrer" data-lit={on !== null || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boardHref} width={7000} height={3022} loading="lazy" decoding="async" alt={locale === "ko" ? `어피니티 맵 원본 보드: 인터뷰 발화 ${total}개를 테마 7개로 묶음` : `The original affinity board: ${total} interview statements grouped into 7 themes`} />
        {COLS.map(([l, w], i) => (
          <i key={i} className="dv-axe-col" data-on={on === i || undefined} style={{ left: `${l}%`, width: `${w}%` }} aria-hidden />
        ))}
        <span className="dv-open-hint" aria-hidden>{ui.open}</span>
      </a>

      <ol className="dv-axe-list" aria-label={ui.list}>
        {AFF_THEMES.map((t, i) => {
          const count = t.subs.reduce((s, x) => s + x.types.length, 0);
          const q = t.quotes[0];
          return (
            <li key={t.name.ko} className="reveal" tabIndex={0} data-on={on === i || undefined} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
              <p className="dv-axe-name"><b>{t.name[locale]}</b><span>{count}{ui.count}</span></p>
              <p className="dv-axe-insight">{t.insight[locale]}</p>
              {q && <blockquote className="dv-axe-quote"><p>“{q.text[locale]}”</p><cite>{AFF_PEOPLE[q.who][locale]}</cite></blockquote>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
