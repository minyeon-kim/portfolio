"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AFF_THEMES, AFF_TYPE_ORDER, AFF_TYPE_COLOR, AFF_TYPE_NAME, AFF_PEOPLE, AFF_UI, type Locale,
} from "@/lib/devsign-affinity";
import { AFF_NOTES } from "@/lib/devsign-affinity-notes";

type Note = { theme: number; sub: number; type: string; who: string; k: number; i: number };
type At = { x: number; y: number; w: number; h: number; open?: boolean; slot?: { x: number; y: number; w: number; h: number } };

// The affinity board from the real FigJam data: all 201 stickies (one per interview statement,
// coloured by type as on the board) start mixed and sort into seven theme columns as mini
// post-its with their first words. Under the board, the open theme's insight sits beside a row
// of readable post-its; pressing any mini post-it lifts it out of its column into that row.
export function AffinityExplorer({ locale, boardHref }: { locale: Locale; boardHref: string }) {
  const ui = AFF_UI[locale];
  const stage = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [sorted, setSorted] = useState(false);
  const [theme, setTheme] = useState(0);
  const [picked, setPicked] = useState<Record<number, number[]>>({});

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 1200));
    ro.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSorted(true); return () => ro.disconnect(); }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setSorted(true);
    }, { rootMargin: "0px 0px -30% 0px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const notes = useMemo(() => {
    const all: Note[] = [];
    AFF_THEMES.forEach((t, ti) => { let i = 0; t.subs.forEach((s, si) => [...s.types].forEach((type, j) => all.push({ theme: ti, sub: si, type, who: s.people[j], k: all.length, i: i++ }))); });
    return all;
  }, []);
  const themeCount = AFF_THEMES.map((_, t) => notes.filter((n) => n.theme === t).length);
  const rand = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
  // The board's quoted stickies come up first.
  const defaultPicks = (t: number) => {
    const list = AFF_NOTES.ko[t];
    const found = AFF_THEMES[t].quotes.map((q) => list.findIndex((x) => x.replace(/\s/g, "").startsWith(q.text.ko.replace(/[\s"“”]/g, "").slice(0, 10)))).filter((i) => i >= 0);
    return [...found, ...list.map((_, i) => i).filter((i) => !found.includes(i))].slice(0, 4);
  };
  const featured = picked[theme] ?? defaultPicks(theme);
  const lift = (n: Note) => {
    setTheme(n.theme);
    setPicked((p) => ({ ...p, [n.theme]: [n.i, ...(p[n.theme] ?? defaultPicks(n.theme)).filter((x) => x !== n.i)].slice(0, 4) }));
  };
  // A mini post-it carries its first words.
  // Filler words are skipped so the tile shows a word that means something.
  const FILLER = new Set(["그냥", "저희는", "저희가", "저는", "제가", "그", "근데", "사실", "이제", "그리고", "그래서", "아", "네", "좀", "약간", "막", "뭔가", "I", "So", "And", "The", "We", "Well", "But", "It", "It's", "That", "Then", "Like", "A", "To"]);
  const head = (n: Note, tw: number) => {
    const words = AFF_NOTES[locale][n.theme][n.i].replace(/[“”"‘'()…,.]/g, "").split(/\s+/).filter(Boolean);
    const word = words.find((x) => !FILLER.has(x)) ?? words[0] ?? "";
    return word.slice(0, locale === "ko" ? Math.max(2, Math.floor((tw - 8) / 12)) : Math.max(3, Math.floor((tw - 8) / 7)));
  };

  const wide = w >= 900;
  const tg = 4;
  const th = wide ? 30 : 32;
  const at = new Map<number, At>();
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  let boardH = 0;

  // Before the board forms: everything mixed in one block.
  const mixPer = Math.max(1, Math.floor((w + tg) / (40 + tg)));
  const mixW = (w - tg * (mixPer - 1)) / mixPer;
  const mixed = new Map<number, At>();
  [...notes].sort((a, b) => rand(a.k) - rand(b.k)).forEach((n, i) => mixed.set(n.k, { x: (i % mixPer) * (mixW + tg), y: Math.floor(i / mixPer) * (th + tg), w: mixW, h: th }));
  const mixedH = Math.ceil(notes.length / mixPer) * (th + tg);

  const tiles = (t: number, x: number, y: number, cw: number, per: number) => {
    const tw = (cw - tg * (per - 1)) / per;
    notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, { x: x + (i % per) * (tw + tg), y: y + Math.floor(i / per) * (th + tg), w: tw, h: th }));
    return Math.ceil(themeCount[t] / per) * (th + tg);
  };

  // The open theme's insight and readable post-its, in a band at (0, y) of width `bw`.
  const insight = AFF_THEMES[theme].insight[locale];
  let insightBox = { x: 0, y: 0, w: 0 };
  const panel = (y: number, bw: number) => {
    const pg = 12;
    const ph = 196;
    const side = bw >= 900;
    const iw = side ? Math.round(bw * 0.3) : bw;
    insightBox = { x: 0, y, w: iw };
    const fs = side ? 20 : 18;
    const lines = Math.ceil((insight.length * fs * (locale === "ko" ? 0.95 : 0.5)) / iw);
    const textH = 26 + lines * fs * 1.45;
    const top = side ? y : y + textH + 20;
    const px = side ? iw + 40 : 0;
    const pw = bw - px;
    const per = side ? 4 : 2;
    const cw = (pw - pg * (per - 1)) / per;
    featured.forEach((i, j) => {
      const n = notes.find((m) => m.theme === theme && m.i === i);
      if (!n) return;
      const prev = at.get(n.k);
      at.set(n.k, { x: px + (j % per) * (cw + pg), y: top + Math.floor(j / per) * (ph + pg), w: cw, h: ph, open: true, slot: prev && { x: prev.x, y: prev.y, w: prev.w, h: prev.h } });
    });
    const rows = Math.ceil(featured.length / per);
    return y + Math.max(side ? textH : 0, top - y + rows * (ph + pg));
  };

  if (wide) {
    const gap = 16;
    const labelH = 72;
    const cw = (w - gap * 6) / 7;
    const per = Math.max(3, Math.floor((cw + tg) / (34 + tg)));
    AFF_THEMES.forEach((_, t) => {
      const x = t * (cw + gap);
      const h = labelH + tiles(t, x, labelH, cw, per);
      boxes.push({ x, y: 0, w: cw, h });
      boardH = Math.max(boardH, h);
    });
    boardH = panel(boardH + 48, w);
  } else {
    const labelH = 60;
    const per = Math.max(4, Math.floor((w + tg) / (40 + tg)));
    let y = 0;
    AFF_THEMES.forEach((_, t) => {
      const h = labelH + tiles(t, 0, y + labelH, w, per);
      boxes.push({ x: 0, y, w, h });
      y += h + 16;
      if (t === theme) y = panel(y, w) + 32;
    });
    boardH = y;
  }

  const layout = sorted ? at : mixed;
  const height = sorted ? boardH : mixedH;

  return (
    <div className="dv-ax dv-ax-tiles dv-gap-40">
      <p className="dv-ax-hint">{ui.pick}</p>
      <div ref={stage} className="dv-ax-stage" style={{ height }}>
        {sorted && boxes.map((b, i) => (
          <button key={i} type="button" className="dv-ax-col" aria-expanded={i === theme} data-on={i === theme || undefined} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} onClick={() => setTheme(i)}>
            <span className="dv-ax-colname">{AFF_THEMES[i].name[locale]}</span>
            <span className="dv-ax-colcount">{themeCount[i]}</span>
          </button>
        ))}
        {sorted && (
          <p key={`insight-${theme}`} className="dv-ax-insight" style={{ left: insightBox.x, top: insightBox.y, width: insightBox.w }}>
            <span>{AFF_THEMES[theme].name[locale]} · {ui.insight}</span>{insight}
          </p>
        )}
        {sorted && notes.map((n) => {
          const sl = at.get(n.k)?.slot;
          return sl ? <i key={`g${n.k}`} className="dv-ax-ghost" style={{ width: sl.w, height: sl.h, transform: `translate(${sl.x}px, ${sl.y}px)`, borderColor: AFF_TYPE_COLOR[n.type] }} /> : null;
        })}
        {notes.map((n) => {
          const a = layout.get(n.k)!;
          const isOpen = !!a.open;
          const text = AFF_NOTES[locale][n.theme][n.i];
          return (
            <div
              key={n.k}
              className="dv-ax-note"
              data-open={isOpen || undefined}
              data-pick={(sorted && !isOpen) || undefined}
              aria-hidden
              onClick={sorted && !isOpen ? () => lift(n) : undefined}
              style={{ width: a.w, height: a.h, background: AFF_TYPE_COLOR[n.type], transform: `translate(${a.x}px, ${a.y}px) rotate(${isOpen ? (rand(n.k) - 0.5) * 2 : 0}deg)`, transitionDelay: `${Math.round(isOpen || sorted ? 0 : rand(n.k + 7) * 200)}ms` } as CSSProperties}
              title={isOpen ? undefined : `${AFF_PEOPLE[n.who][locale]} · ${AFF_TYPE_NAME[n.type][locale]}: ${text}`}
            >
              {isOpen
                ? <><p>{text}</p><span>{AFF_PEOPLE[n.who][locale]} · {AFF_TYPE_NAME[n.type][locale]}</span></>
                : <b>{head(n, a.w)}</b>}
            </div>
          );
        })}
      </div>
      <ul className="dv-ax-types" aria-label={ui.legend}>
        {AFF_TYPE_ORDER.map((ty) => <li key={ty}><i style={{ background: AFF_TYPE_COLOR[ty] }} />{AFF_TYPE_NAME[ty][locale]}</li>)}
      </ul>
      <p className="dv-aff-foot"><a className="link" href={boardHref} target="_blank" rel="noreferrer">{ui.boardLink}</a></p>

      <div className="sr-only">
        <ol>
          {AFF_THEMES.map((th, i) => (
            <li key={th.name.ko}>{th.name[locale]} ({themeCount[i]}): {th.insight[locale]}
              <ul>{AFF_NOTES[locale][i].map((q, j) => <li key={j}>{q}</li>)}</ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
