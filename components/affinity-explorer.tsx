"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AFF_THEMES, AFF_TYPE_ORDER, AFF_TYPE_COLOR, AFF_TYPE_NAME, AFF_PEOPLE, AFF_UI, type Locale,
} from "@/lib/devsign-affinity";
import { AFF_NOTES } from "@/lib/devsign-affinity-notes";

type Note = { theme: number; sub: number; type: string; who: string; k: number; i: number };
type At = { x: number; y: number; w: number; h: number; o: number; open?: boolean; pick?: boolean; slot?: { x: number; y: number } };
type Label = { key: string; x: number; y: number; w: number; text: string; kind: "sub" | "insight" };

// The affinity board from the real FigJam data, as one board: the 201 stickies (one per
// interview statement, coloured by type as on the board) start mixed and sort into the
// seven theme columns. One column is open at a time: it widens and its stickies grow in
// place into readable post-its under the board's insight and sub-groups, while the other
// columns stay narrow with their stickies as small squares. Picking a column opens it.
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
    // The stickies sort into the board once it has risen into view (native scroll).
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
  // The board's quoted stickies for a theme, matched to their place in the notes.
  const defaultPicks = (t: number) => {
    const list = AFF_NOTES.ko[t];
    const found = AFF_THEMES[t].quotes.map((q) => list.findIndex((x) => x.replace(/\s/g, "").startsWith(q.text.ko.replace(/[\s"“”]/g, "").slice(0, 10)))).filter((i) => i >= 0);
    const rest = list.map((_, i) => i).filter((i) => !found.includes(i));
    return [...found, ...rest].slice(0, 4);
  };
  const pickNote = (i: number) => setPicked((p) => { const cur = p[theme] ?? defaultPicks(theme); return { ...p, [theme]: [i, ...cur.filter((x) => x !== i)].slice(0, 4) }; });
  const themeCount = AFF_THEMES.map((_, t) => notes.filter((n) => n.theme === t).length);
  const rand = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };

  const wide = w >= 900;
  const s = 12;
  const g = 3;
  const cell = s + g;
  const sq = (x: number, y: number): At => ({ x, y, w: s, h: s, o: 1 });

  // Before the board forms: all 201 mixed in one block.
  const perRow = Math.max(1, Math.floor((w + g) / cell));
  const mixed = new Map<number, At>();
  [...notes].sort((a, b) => rand(a.k) - rand(b.k)).forEach((n, i) => mixed.set(n.k, sq((i % perRow) * cell, Math.floor(i / perRow) * cell)));
  const mixedH = Math.ceil(notes.length / perRow) * cell;

  // The open column's insight and post-its, laid out inside a box of width `ow` at (ox, oy).
  const labels: Label[] = [];
  const at = new Map<number, At>();
  // The open column fits one screen: the insight, a row of readable post-its (the board's
  // quoted stickies first; press any square to bring it up), then every sticky of the theme
  // as a small square under its sub-group.
  const featured = picked[theme] ?? defaultPicks(theme);
  const openNotes = (ox: number, oy: number, ow: number) => {
    const fs = ow < 640 ? 18 : 20;
    const text = AFF_THEMES[theme].insight[locale];
    const lines = Math.ceil((text.length * fs * (locale === "ko" ? 0.95 : 0.5)) / ow);
    labels.push({ key: "insight", x: ox, y: oy, w: ow, text, kind: "insight" });
    let y = oy + 26 + lines * fs * 1.45 + 40;
    const pg = 12;
    const per = Math.max(1, Math.min(4, Math.floor((ow + pg) / ((ow < 640 ? 150 : 180) + pg))));
    const pw = (ow - pg * (per - 1)) / per;
    const ph = 188;
    const shown = featured.slice(0, per);
    shown.forEach((i, j) => {
      const n = notes.find((m) => m.theme === theme && m.i === i);
      if (n) at.set(n.k, { x: ox + j * (pw + pg), y, w: pw, h: ph, o: 1, open: true });
    });
    y += ph + 28;
    const big = 14;
    const bc = big + 4;
    const rowPer = Math.max(1, Math.floor((ow + 4) / bc));
    AFF_THEMES[theme].subs.forEach((sub, si) => {
      labels.push({ key: `sub-${si}`, x: ox, y, w: ow, text: `${sub.name[locale]} ${sub.types.length}`, kind: "sub" });
      y += 30;
      notes.filter((n) => n.theme === theme && n.sub === si).forEach((n, i) => {
        if (!at.has(n.k)) at.set(n.k, { x: ox + (i % rowPer) * bc, y: y + Math.floor(i / rowPer) * bc, w: big, h: big, o: 1, pick: true });
        else at.set(n.k, { ...at.get(n.k)!, slot: { x: ox + (i % rowPer) * bc, y: y + Math.floor(i / rowPer) * bc } });
      });
      y += Math.ceil(sub.types.length / rowPer) * bc + 14;
    });
    return y;
  };

  const boxes: { x: number; y: number; w: number; h: number; head: number }[] = [];
  let boardH = 0;
  if (wide) {
    // Columns side by side: six narrow ones, the open one taking the rest.
    const gap = 12;
    const cw = 84;
    const ow = w - 6 * (cw + gap);
    const labelH = 72;
    let x = 0;
    AFF_THEMES.forEach((_, t) => {
      if (t === theme) {
        const bottom = openNotes(x, labelH, ow);
        boxes.push({ x, y: 0, w: ow, h: bottom, head: labelH });
        boardH = Math.max(boardH, bottom);
        x += ow + gap;
        return;
      }
      const per = Math.max(1, Math.floor((cw + g) / cell));
      notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, sq(x + (i % per) * cell, labelH + Math.floor(i / per) * cell)));
      const h = labelH + Math.ceil(themeCount[t] / per) * cell;
      boxes.push({ x, y: 0, w: cw, h, head: h });
      boardH = Math.max(boardH, h);
      x += cw + gap;
    });
  } else {
    // Phones and tablets: one row per theme, the open one unfolding under its name.
    const labelH = 56;
    const per = Math.max(1, Math.floor((w + g) / cell));
    let y = 0;
    AFF_THEMES.forEach((_, t) => {
      if (t === theme) {
        const bottom = openNotes(0, y + labelH, w);
        boxes.push({ x: 0, y, w, h: bottom - y, head: labelH });
        y = bottom + 16;
        return;
      }
      notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, sq((i % per) * cell, y + labelH + Math.floor(i / per) * cell)));
      const h = labelH + Math.ceil(themeCount[t] / per) * cell;
      boxes.push({ x: 0, y, w, h, head: h });
      y += h + 24;
    });
    boardH = y;
  }

  const layout = sorted ? at : mixed;
  const height = sorted ? boardH : mixedH;

  return (
    <div className="dv-ax dv-gap-40">
      <p className="dv-ax-hint">{ui.pick}</p>
      <div ref={stage} className="dv-ax-stage" data-sorted={sorted || undefined} style={{ height }}>
        {sorted && boxes.map((b, i) => (
          <button key={i} type="button" className="dv-ax-col" aria-expanded={i === theme} data-on={i === theme || undefined} style={{ left: b.x, top: b.y, width: b.w, height: b.head }} onClick={() => setTheme(i)}>
            <span className="dv-ax-colname">{AFF_THEMES[i].name[locale]}</span>
            <span className="dv-ax-colcount">{themeCount[i]}</span>
          </button>
        ))}
        {sorted && labels.map((l) => (
          <p key={`${theme}-${l.key}`} className={l.kind === "insight" ? "dv-ax-insight" : "dv-ax-subhead"} style={{ left: l.x, top: l.y, width: l.w }}>
            {l.kind === "insight" && <span>{ui.insight}</span>}{l.text}
          </p>
        ))}
        {sorted && notes.map((n) => {
          const sl = at.get(n.k)?.slot;
          return sl ? <i key={`g${n.k}`} className="dv-ax-ghost" style={{ transform: `translate(${sl.x}px, ${sl.y}px)`, borderColor: AFF_TYPE_COLOR[n.type] }} /> : null;
        })}
        {notes.map((n) => {
          const a = layout.get(n.k)!;
          const isOpen = !!a.open;
          return (
            <div
              key={n.k}
              className="dv-ax-note"
              data-open={isOpen || undefined}
              data-pick={a.pick || undefined}
              aria-hidden
              onClick={a.pick ? () => pickNote(n.i) : undefined}
              style={{ width: a.w, height: a.h, background: AFF_TYPE_COLOR[n.type], opacity: a.o, transform: `translate(${a.x}px, ${a.y}px) rotate(${isOpen ? (rand(n.k) - 0.5) * 2 : 0}deg)`, transitionDelay: `${Math.round(isOpen ? n.i * 14 : rand(n.k + 7) * 200)}ms` } as CSSProperties}
              title={isOpen ? undefined : `${AFF_TYPE_NAME[n.type][locale]} · ${AFF_PEOPLE[n.who][locale]}: ${AFF_NOTES[locale][n.theme][n.i]}`}
            >
              {isOpen && <>
                <p>{AFF_NOTES[locale][n.theme][n.i]}</p>
                <span>{AFF_PEOPLE[n.who][locale]} · {AFF_TYPE_NAME[n.type][locale]}</span>
              </>}
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
