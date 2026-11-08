"use client";

import { useState } from "react";
import { AFF_THEMES, AFF_LEFT_OUT, type Locale } from "@/lib/devsign-affinity";

// Where each theme's column sits on the real board image (affinity-board.webp, 7000 x 3022),
// as left / width in % of its width; the columns run in the same order as AFF_THEMES.
const COLS: [number, number][] = [
  [0.6, 13.7], [14.7, 13.6], [28.6, 13.7], [42.7, 13.6], [56.6, 13.7], [70.6, 14.2], [85.1, 14.3],
];

const UI = {
  ko: { list: "테마 7개", open: "크게 보기 ↗", out: "문제로 이어지지 않음" },
  en: { list: "Seven themes", open: "View full size ↗", out: "Not carried into the problems" },
};

// One line per theme, shortened from the board's insight (the full insight stays for screen readers).
const SHORT: { ko: string; en: string }[] = [
  { ko: "피드백과 결정이 작업과 따로 흩어진다", en: "Feedback and decisions scatter away from the work" },
  { ko: "왜 이 버전이 최종인지가 남지 않는다", en: "Why a version became final isn't kept" },
  { ko: "더 많은 정보보다, 함께 보는 기준이 필요하다", en: "Teams need one shared reference, not more information" },
  { ko: "AI에 판단을 맡기기보다, 사람이 볼 부분을 줄이고 싶다", en: "People want less to judge, not to hand judgment off" },
  { ko: "역할은 겹치는데 책임 기준은 그대로다", en: "Roles overlap, but ownership rules haven't caught up" },
  { ko: "AI 도구가 늘수록 맥락이 쪼개진다", en: "More AI tools, more scattered context" },
  { ko: "반복 작업은 빠르지만, 예외는 결국 사람이 본다", en: "AI is fast on routine work; people still check the exceptions" },
];

// The affinity mapping as evidence, then what it found: the real FigJam board as one image
// (opens full size), and under it the seven themes as rows (name and count, the board's
// insight, one real statement). Pointing at a row lights its column on the board.
export function AffinityExplorer({ locale, boardHref }: { locale: Locale; boardHref: string }) {
  const ui = UI[locale];
  const [on, setOn] = useState<number | null>(null);
  const total = AFF_THEMES.reduce((sum, t) => sum + t.subs.reduce((s, x) => s + x.types.length, 0), 0);

  return (
    <div className="dv-axe dv-gap-40">
      <ol className="dv-axe-grid" aria-label={ui.list}>
        {AFF_THEMES.map((t, i) => {
          const count = t.subs.reduce((s, x) => s + x.types.length, 0);
          const out = i === AFF_LEFT_OUT;
          return (
            <li key={t.name.ko} className="reveal" tabIndex={0} data-on={on === i || undefined} data-out={out || undefined} onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
              <p className="dv-axe-name"><b>{t.name[locale]}</b><span>{count}</span></p>
              <p className="dv-axe-short">{SHORT[i][locale]}</p>
              {out && <p className="dv-axe-out">{ui.out}</p>}
              <span className="sr-only">{t.insight[locale]}</span>
            </li>
          );
        })}
      </ol>

      <a className="dv-axe-board reveal" href={boardHref} target="_blank" rel="noreferrer" data-lit={on !== null || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={boardHref} width={7000} height={3022} loading="lazy" decoding="async" alt={locale === "ko" ? `어피니티 맵 원본 보드: 인터뷰 발화 ${total}개를 테마 7개로 묶음` : `The original affinity board: ${total} interview statements grouped into 7 themes`} />
        {COLS.map(([l, w], i) => (
          <i key={i} className="dv-axe-col" data-on={on === i || undefined} style={{ left: `${l}%`, width: `${w}%` }} aria-hidden />
        ))}
        <span className="dv-open-hint" aria-hidden>{ui.open}</span>
      </a>
    </div>
  );
}
