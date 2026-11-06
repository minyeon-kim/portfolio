"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AFF_THEMES, AFF_TYPE_ORDER, AFF_TYPE_COLOR, AFF_TYPE_NAME, AFF_PEOPLE,
  AFF_PROBLEM_THEMES, AFF_LEFT_OUT, AFF_UI, type Locale,
} from "@/lib/devsign-affinity";
import { AFF_NOTES } from "@/lib/devsign-affinity-notes";

type Note = { theme: number; sub: number; type: string; who: string; k: number; i: number };
type At = { x: number; y: number; w: number; h: number; o: number; open?: boolean };
type Label = { key: string; x: number; y: number; w: number; text: string; kind: "sub" | "insight" };

// The affinity map from the real FigJam board, as one set of stickies that move: 201 small
// stickies (one per interview statement, coloured by type as on the board) start mixed,
// sort into the seven themes, and the open theme's stickies grow in place into readable
// post-its under their sub-groups; picking another theme sends them back into their column
// and the next one opens. The last step regroups the themes into the four problems.
export function AffinityExplorer({ locale, problems, boardHref }: { locale: Locale; problems: { title: string; body: string }[]; boardHref: string }) {
  const ui = AFF_UI[locale];
  const stage = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState(0);
  const [problem, setProblem] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 1200));
    ro.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(1); return () => ro.disconnect(); }
    // The stickies sort into themes once the block has risen into view (native scroll).
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || touched.current) return;
      io.disconnect();
      setStep(1);
    }, { rootMargin: "0px 0px -45% 0px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const notes = useMemo(() => {
    const all: Note[] = [];
    AFF_THEMES.forEach((t, ti) => { let i = 0; t.subs.forEach((s, si) => [...s.types].forEach((type, j) => all.push({ theme: ti, sub: si, type, who: s.people[j], k: all.length, i: i++ }))); });
    return all;
  }, []);
  const typeCount = AFF_TYPE_ORDER.map((ty) => notes.filter((n) => n.type === ty).length);
  const themeCount = AFF_THEMES.map((_, t) => notes.filter((n) => n.theme === t).length);
  const rand = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };

  // Geometry.
  const narrow = w < 640;
  const s = narrow ? 12 : 18;
  const g = narrow ? 3 : 5;
  const cell = s + g;
  const colGap = narrow ? 8 : 16;
  const labelH = 72;
  const sq = (x: number, y: number, o = 1): At => ({ x, y, w: s, h: s, o });

  // Step 0: all 201 mixed in one block.
  const perRow = Math.max(1, Math.floor((w + g) / cell));
  const mixed = new Map<number, At>();
  [...notes].sort((a, b) => rand(a.k) - rand(b.k)).forEach((n, i) => mixed.set(n.k, sq((i % perRow) * cell, Math.floor(i / perRow) * cell)));
  const mixedH = Math.ceil(notes.length / perRow) * cell;

  // Columns (themes or problems), squares stacked under a label; narrow screens wrap to rows of four.
  const columns = (groups: number[][]) => {
    const at = new Map<number, At>();
    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const count = groups.length;
    const cols = narrow ? Math.min(count, 4) : count;
    const cw = (w - colGap * (cols - 1)) / cols;
    const per = Math.max(1, Math.floor((cw + g) / cell));
    const heights: number[] = [];
    groups.forEach((themes) => {
      let row = 0;
      themes.forEach((t, j) => { if (j > 0) row += 0.6; row += Math.ceil(themeCount[t] / per); });
      heights.push(labelH + row * cell);
    });
    const bandH: number[] = [];
    heights.forEach((h, c) => { const b = Math.floor(c / cols); bandH[b] = Math.max(bandH[b] ?? 0, h); });
    const bandTop = bandH.map((_, b) => bandH.slice(0, b).reduce((sum, h) => sum + h + 24, 0));
    groups.forEach((themes, c) => {
      const x = (c % cols) * (cw + colGap);
      const top = bandTop[Math.floor(c / cols)];
      let row = 0;
      themes.forEach((t, j) => {
        if (j > 0) row += 0.6;
        notes.filter((n) => n.theme === t).forEach((n, i) => at.set(n.k, sq(x + (i % per) * cell, top + labelH + (row + Math.floor(i / per)) * cell)));
        row += Math.ceil(themeCount[t] / per);
      });
      boxes.push({ x, y: top, w: cw, h: heights[c] });
    });
    const h = bandTop[bandTop.length - 1] + bandH[bandH.length - 1];
    return { at, boxes, h };
  };
  const byTheme = columns(AFF_THEMES.map((_, t) => [t]));
  const problemGroups = [...AFF_PROBLEM_THEMES, [AFF_LEFT_OUT]];
  const byProblem = columns(problemGroups);
  byProblem.at.forEach((a, k) => { if (notes[k].theme === AFF_LEFT_OUT) byProblem.at.set(k, { ...a, o: 0.3 }); });

  // The open theme: its stickies leave their column and grow into post-its below, by sub-group.
  const labels: Label[] = [];
  const open = new Map(byTheme.at);
  let openH = byTheme.h;
  if (step === 1) {
    const pg = narrow ? 10 : 16;
    const per = narrow ? 2 : Math.max(2, Math.floor((w + pg) / (196 + pg)));
    const pw = (w - pg * (per - 1)) / per;
    const ph = narrow ? 150 : 168;
    let y = byTheme.h + 56;
    labels.push({ key: "insight", x: 0, y, w: Math.min(w, 900), text: AFF_THEMES[theme].insight[locale], kind: "insight" });
    y += narrow ? 170 : 128;
    AFF_THEMES[theme].subs.forEach((sub, si) => {
      labels.push({ key: `sub-${si}`, x: 0, y, w, text: `${sub.name[locale]} ${sub.types.length}`, kind: "sub" });
      y += 52;
      notes.filter((n) => n.theme === theme && n.sub === si).forEach((n, i) => {
        open.set(n.k, { x: (i % per) * (pw + pg), y: y + Math.floor(i / per) * (ph + pg), w: pw, h: ph, o: 1, open: true });
      });
      y += Math.ceil(sub.types.length / per) * (ph + pg) + 24;
    });
    openH = y;
  }

  const layout = step === 0 ? mixed : step === 1 ? open : byProblem.at;
  const height = step === 0 ? mixedH : step === 1 ? openH : byProblem.h + (narrow ? 260 : 220);
  const pick = (i: number) => { touched.current = true; setStep(i); };

  return (
    <div className="dv-ax dv-gap-40">
      <div className="dv-ax-steps" role="tablist" aria-label={ui.steps.map(([n, l]) => `${n} ${l}`).join(" → ")}>
        {ui.steps.map(([n, label], i) => (
          <button key={label} type="button" role="tab" aria-selected={i === step} data-on={i === step || undefined} data-done={i < step || undefined} onClick={() => pick(i)}>
            <strong>{n}</strong><span>{label}</span>
          </button>
        ))}
      </div>
      <p className="dv-ax-hint">{step === 0 ? ui.legend : step === 1 ? ui.pick : ui.pickProblem}</p>
      {step === 0 && (
        <ul className="dv-ax-types">
          {AFF_TYPE_ORDER.map((ty, i) => <li key={ty}><i style={{ background: AFF_TYPE_COLOR[ty] }} />{AFF_TYPE_NAME[ty][locale]}<b>{typeCount[i]}</b></li>)}
        </ul>
      )}

      <div ref={stage} className="dv-ax-stage" data-step={step} style={{ height }}>
        {step === 1 && byTheme.boxes.map((b, i) => (
          <button key={i} type="button" className="dv-ax-col" aria-pressed={i === theme} data-on={i === theme || undefined} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} onClick={() => setTheme(i)}>
            <span className="dv-ax-colname">{AFF_THEMES[i].name[locale]}</span>
            <span className="dv-ax-colcount">{themeCount[i]}</span>
          </button>
        ))}
        {step === 2 && byProblem.boxes.map((b, i) => {
          const out = i === problemGroups.length - 1;
          return (
            <button key={i} type="button" className="dv-ax-col" data-out={out || undefined} aria-pressed={!out && i === problem} data-on={(!out && i === problem) || undefined} disabled={out} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} onClick={() => setProblem(i)}>
              <span className="dv-ax-colname">{out ? <>{AFF_THEMES[AFF_LEFT_OUT].name[locale]}<em>{ui.leftOut}</em></> : <><b>{i + 1}</b>{problems[i]?.title}</>}</span>
            </button>
          );
        })}
        {labels.map((l) => (
          <p key={`${theme}-${l.key}`} className={l.kind === "insight" ? "dv-ax-insight" : "dv-ax-subhead"} style={{ left: l.x, top: l.y, width: l.w }}>
            {l.kind === "insight" && <span>{ui.insight}</span>}{l.text}
          </p>
        ))}
        {notes.map((n) => {
          const a = layout.get(n.k)!;
          const isOpen = !!a.open;
          const dim = step === 2 && !(AFF_PROBLEM_THEMES[problem] ?? []).includes(n.theme);
          return (
            <div
              key={n.k}
              className="dv-ax-note"
              data-open={isOpen || undefined}
              data-dim={dim || undefined}
              style={{ width: a.w, height: a.h, background: AFF_TYPE_COLOR[n.type], opacity: a.o, transform: `translate(${a.x}px, ${a.y}px) rotate(${isOpen ? (rand(n.k) - 0.5) * 2.4 : 0}deg)`, transitionDelay: `${Math.round(isOpen ? n.i * 18 : rand(n.k + 7) * 240)}ms` } as CSSProperties}
              title={isOpen ? undefined : `${AFF_TYPE_NAME[n.type][locale]} · ${AFF_PEOPLE[n.who][locale]}: ${AFF_NOTES[locale][n.theme][n.i]}`}
            >
              {isOpen && <>
                <p>{AFF_NOTES[locale][n.theme][n.i]}</p>
                <span>{AFF_PEOPLE[n.who][locale]} · {AFF_TYPE_NAME[n.type][locale]}</span>
              </>}
            </div>
          );
        })}
        {step === 2 && problems[problem] && (
          <div className="dv-ax-problem" style={{ top: byProblem.h + 40 }}>
            <p className="dv-ax-kicker">{problem + 1} / {AFF_PROBLEM_THEMES.length}</p>
            <h4 className="dv-ax-title">{problems[problem].title}</h4>
            <p className="dv-ax-text">{problems[problem].body}</p>
            <p className="dv-ax-from">{ui.from}: {AFF_PROBLEM_THEMES[problem].map((ti) => `${AFF_THEMES[ti].name[locale]} ${themeCount[ti]}`).join(" · ")}</p>
          </div>
        )}
      </div>

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
