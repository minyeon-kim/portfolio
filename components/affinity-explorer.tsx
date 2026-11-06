"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useHeldSteps } from "./devsign-story";
import {
  AFF_THEMES, AFF_TYPE_ORDER, AFF_TYPE_COLOR, AFF_TYPE_NAME, AFF_PEOPLE,
  AFF_PROBLEM_THEMES, AFF_LEFT_OUT, AFF_UI, type Locale,
} from "@/lib/devsign-affinity";
import { AFF_NOTES } from "@/lib/devsign-affinity-notes";

type Note = { theme: number; sub: number; type: string; who: string; k: number; i: number };
type At = { x: number; y: number; o: number };

// The affinity map from the real FigJam board: 201 stickies (one per interview statement,
// coloured by type as on the board) that regroup into the seven themes, then the four
// problems. On desktop native scroll moves the steps while the stage holds; the step tabs
// work everywhere. Pointing at a theme or problem shows its insight, sub-groups and quotes.
export function AffinityExplorer({ locale, problems, boardHref }: { locale: Locale; problems: { title: string; body: string }[]; boardHref: string }) {
  const ui = AFF_UI[locale];
  const held = useHeldSteps(3);
  const [tabStep, setTabStep] = useState(1);
  const step = held.pinned ? held.active : tabStep;
  const stage = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(760);
  const [theme, setTheme] = useState(2);
  const [problem, setProblem] = useState(3);
  const [tip, setTip] = useState<{ n: Note; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const notes = useMemo(() => {
    const all: Note[] = [];
    AFF_THEMES.forEach((t, ti) => { let i = 0; t.subs.forEach((s, si) => [...s.types].forEach((type, j) => all.push({ theme: ti, sub: si, type, who: s.people[j], k: all.length, i: i++ }))); });
    return all;
  }, []);
  const typeCount = AFF_TYPE_ORDER.map((ty) => notes.filter((n) => n.type === ty).length);
  const themeCount = AFF_THEMES.map((_, t) => notes.filter((n) => n.theme === t).length);

  // Geometry. Stickies are small squares; the stage's height follows the tallest layout.
  const narrow = w < 640;
  const s = narrow ? 14 : 20;
  const g = narrow ? 3 : 5;
  const cell = s + g;
  // Seven columns at a 1280 screen leave three-line theme names, so the label area grows.
  const labelH = narrow ? 48 : w / 7 < 150 ? 96 : 72;
  const colGap = narrow ? 8 : 16;
  const rand = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };

  // Step 1: all 201 mixed in one block (the board before sorting).
  const perRow = Math.max(1, Math.floor((w + g) / cell));
  const mixedOrder = [...notes].sort((a, b) => rand(a.k) - rand(b.k));
  const mixed = new Map<number, At>();
  mixedOrder.forEach((n, i) => mixed.set(n.k, { x: (i % perRow) * cell, y: labelH + Math.floor(i / perRow) * cell, o: 1 }));
  const mixedH = labelH + Math.ceil(notes.length / perRow) * cell;

  // Columns for steps 2 and 3. Narrow screens use rows instead.
  const columns = (groups: number[][], count: number) => {
    const at = new Map<number, At>();
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    if (!narrow) {
      const cw = (w - colGap * (count - 1)) / count;
      const per = Math.max(1, Math.floor((cw + g) / cell));
      let maxH = 0;
      groups.forEach((themes, c) => {
        let row = 0;
        themes.forEach((t, j) => {
          if (j > 0) row += 0.6;
          notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, { x: c * (cw + colGap) + (i % per) * cell, y: labelH + (row + Math.floor(i / per)) * cell, o: 1 }));
          row += Math.ceil(themeCount[t] / per);
        });
        const h = labelH + row * cell;
        boxes.push({ x: c * (cw + colGap), y: 0, w: cw, h });
        maxH = Math.max(maxH, h);
      });
      return { at, boxes, h: maxH };
    }
    const per = Math.max(1, Math.floor((w + g) / cell));
    let y = 0;
    groups.forEach((themes) => {
      const top = y;
      y += labelH;
      themes.forEach((t, j) => {
        if (j > 0) y += cell * 0.6;
        notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, { x: (i % per) * cell, y: y + Math.floor(i / per) * cell, o: 1 }));
        y += Math.ceil(themeCount[t] / per) * cell;
      });
      boxes.push({ x: 0, y: top, w, h: y - top });
      y += 16;
    });
    return { at, boxes, h: y };
  };
  const byTheme = columns(AFF_THEMES.map((_, t) => [t]), 7);
  const problemGroups = [...AFF_PROBLEM_THEMES, [AFF_LEFT_OUT]];
  const byProblem = columns(problemGroups, problemGroups.length);
  byProblem.at.forEach((a, k) => { if (notes[k].theme === AFF_LEFT_OUT) byProblem.at.set(k, { ...a, o: 0.25 }); });

  const layout = step === 0 ? { at: mixed, h: mixedH } : step === 1 ? byTheme : byProblem;
  const height = held.pinned ? Math.max(mixedH, byTheme.h, byProblem.h) : layout.h;

  const t = AFF_THEMES[theme];
  const themeTypes = AFF_TYPE_ORDER.map((ty) => notes.filter((n) => n.theme === theme && n.type === ty).length);
  const lit = (n: Note) => step === 1 ? n.theme === theme : step === 2 ? (AFF_PROBLEM_THEMES[problem] ?? []).includes(n.theme) : true;
  const go = (i: number) => (held.pinned ? held.go(i) : setTabStep(i));

  return (
    <>
    <div ref={held.root} className="dv-held-track dv-ax-track dv-gap-40" style={{ "--n": 3 } as CSSProperties}>
      <div className="dv-ax">
        <div className="dv-ax-steps" role="tablist" aria-label={ui.steps.map(([n, l]) => `${n} ${l}`).join(" → ")}>
          {ui.steps.map(([n, label], i) => (
            <button key={label} type="button" role="tab" aria-selected={i === step} data-on={i === step || undefined} data-done={i < step || undefined} onClick={() => go(i)}>
              <strong>{n}</strong><span>{label}</span>
            </button>
          ))}
        </div>

        <div className="dv-ax-body">
          <div ref={stage} className="dv-ax-stage" data-step={step} style={{ height }} onMouseLeave={() => setTip(null)}>
            {step === 0 && <p className="dv-ax-label" style={{ left: 0, top: 0 }}>{ui.legend}</p>}
            {step === 1 && byTheme.boxes.map((b, i) => (
              <button key={i} type="button" className="dv-ax-col" data-on={i === theme || undefined} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} onMouseEnter={() => setTheme(i)} onFocus={() => setTheme(i)} onClick={() => setTheme(i)}>
                <span className="dv-ax-colname">{AFF_THEMES[i].name[locale]}</span>
                <span className="dv-ax-colcount">{themeCount[i]}</span>
              </button>
            ))}
            {step === 2 && byProblem.boxes.map((b, i) => {
              const out = i === problemGroups.length - 1;
              return (
                <button key={i} type="button" className="dv-ax-col" data-out={out || undefined} data-on={(!out && i === problem) || undefined} disabled={out} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} onMouseEnter={() => !out && setProblem(i)} onFocus={() => setProblem(i)} onClick={() => setProblem(i)}>
                  <span className="dv-ax-colname">{out ? <>{AFF_THEMES[AFF_LEFT_OUT].name[locale]}<em>{ui.leftOut}</em></> : <><b>{i + 1}</b>{problems[i]?.title}</>}</span>
                </button>
              );
            })}
            {notes.map((n) => {
              const a = layout.at.get(n.k)!;
              return (
                <i
                  key={n.k}
                  className="dv-ax-note"
                  data-dim={(!lit(n)) || undefined}
                  style={{ width: s, height: s, background: AFF_TYPE_COLOR[n.type], opacity: a.o, transform: `translate(${a.x}px, ${a.y}px)`, transitionDelay: `${Math.round(rand(n.k + 7) * 260)}ms` }}
                  onMouseEnter={() => setTip({ n, x: a.x, y: a.y })}
                />
              );
            })}
            {tip && (
              <p className="dv-ax-tip" style={{ left: Math.min(tip.x, w - 220), top: tip.y + s + 6 }}>
                <i style={{ background: AFF_TYPE_COLOR[tip.n.type] }} />{AFF_TYPE_NAME[tip.n.type][locale]} · {AFF_PEOPLE[tip.n.who][locale]}<br />
                <span>{AFF_THEMES[tip.n.theme].name[locale]} › {AFF_THEMES[tip.n.theme].subs[tip.n.sub].name[locale]}</span><br />
                <q>{AFF_NOTES[locale][tip.n.theme][tip.n.i]}</q>
              </p>
            )}
          </div>

          <aside className="dv-ax-panel" aria-live="polite">
            {step === 0 && (
              <ul className="dv-ax-types">
                {AFF_TYPE_ORDER.map((ty, i) => (
                  <li key={ty}><i style={{ background: AFF_TYPE_COLOR[ty] }} /><span>{AFF_TYPE_NAME[ty][locale]}</span><b>{typeCount[i]}</b></li>
                ))}
              </ul>
            )}
            {step === 1 && (
              <>
                <p className="dv-ax-kicker">{String(theme + 1).padStart(2, "0")} · {themeCount[theme]}{ui.statements}</p>
                <h4 className="dv-ax-title">{t.name[locale]}</h4>
                <div className="dv-ax-bar" aria-hidden="true">
                  {AFF_TYPE_ORDER.map((ty, i) => themeTypes[i] > 0 && <i key={ty} style={{ flex: themeTypes[i], background: AFF_TYPE_COLOR[ty] }} />)}
                </div>
                <p className="dv-ax-insight"><span>{ui.insight}</span>{t.insight[locale]}</p>
                <p className="dv-ax-sublabel">{ui.subs}</p>
                <ul className="dv-ax-subs">
                  {t.subs.map((sub) => <li key={sub.name.ko}><span>{sub.name[locale]}</span><b>{sub.types.length}</b></li>)}
                </ul>
                <p className="dv-ax-sublabel">{ui.quotes}</p>
                <ul className="dv-ax-quotes">
                  {t.quotes.slice(0, 2).map((q) => <li key={q.text.ko}>“{q.text[locale]}”<span>{AFF_PEOPLE[q.who][locale]}</span></li>)}
                </ul>
              </>
            )}
            {step === 2 && problems[problem] && (
              <>
                <p className="dv-ax-kicker">{problem + 1} / {AFF_PROBLEM_THEMES.length}</p>
                <h4 className="dv-ax-title">{problems[problem].title}</h4>
                <p className="dv-ax-text">{problems[problem].body}</p>
                <p className="dv-ax-sublabel">{ui.from}</p>
                <ul className="dv-ax-subs">
                  {AFF_PROBLEM_THEMES[problem].map((ti) => <li key={ti}><span>{AFF_THEMES[ti].name[locale]}</span><b>{themeCount[ti]}</b></li>)}
                </ul>
                <ul className="dv-ax-quotes">
                  {AFF_PROBLEM_THEMES[problem].slice(0, 2).map((ti) => { const q = AFF_THEMES[ti].quotes[0]; return <li key={ti}>“{q.text[locale]}”<span>{AFF_PEOPLE[q.who][locale]}</span></li>; })}
                </ul>
              </>
            )}
          </aside>
        </div>

        <p className="dv-aff-foot"><a className="link" href={boardHref} target="_blank" rel="noreferrer">{ui.boardLink}</a></p>

        <div className="sr-only">
          <ol>
            {AFF_THEMES.map((th, i) => (
              <li key={th.name.ko}>{th.name[locale]} ({themeCount[i]}): {th.insight[locale]}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
    {/* The board itself: the picked theme's stickies as post-its, word for word, by sub-group. */}
    <div className="dv-axb">
      <p className="dv-axb-label">{ui.boardTitle}</p>
      <div className="dv-axb-tabs" role="tablist" aria-label={ui.boardTitle}>
        {AFF_THEMES.map((th, i) => (
          <button key={th.name.ko} type="button" role="tab" aria-selected={i === theme} data-on={i === theme || undefined} onClick={() => setTheme(i)}>
            {th.name[locale]}<b>{themeCount[i]}</b>
          </button>
        ))}
      </div>
      <p className="dv-axb-insight"><span>{ui.insight}</span>{t.insight[locale]}</p>
      {(() => { let i = 0; return t.subs.map((sub) => (
        <section key={sub.name.ko} className="dv-axb-sub">
          <h4>{sub.name[locale]}<b>{sub.types.length}</b></h4>
          <ul>
            {[...sub.types].map((ty, j) => { const n = i++; return (
              <li key={j} className="dv-axb-note" style={{ background: AFF_TYPE_COLOR[ty], rotate: `${(rand(theme * 97 + n) - 0.5) * 2.4}deg` } as CSSProperties}>
                <p>{AFF_NOTES[locale][theme][n]}</p>
                <span>{AFF_PEOPLE[sub.people[j]][locale]} · {AFF_TYPE_NAME[ty][locale]}</span>
              </li>
            ); })}
          </ul>
        </section>
      )); })()}
      <ul className="dv-axb-legend">
        {AFF_TYPE_ORDER.map((ty) => <li key={ty}><i style={{ background: AFF_TYPE_COLOR[ty] }} />{AFF_TYPE_NAME[ty][locale]}</li>)}
      </ul>
    </div>
    </>
  );
}
