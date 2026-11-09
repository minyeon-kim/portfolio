"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { TALL_PIN, useHeldSteps } from "@/components/devsign-story";

type Segment = { label: string; value: number; on?: boolean; rest?: boolean };
type Source = { label: string; url?: string; detail?: string };
type Base = { tab: string; title: string; note?: string; source?: Source };
type DonutChart = Base & { type: "donut"; value: string; valueLabel: string; segments: Segment[] };
type BarChart = Base & { type: "bars"; bars: { label: string; value: number }[] };
type PairChart = Base & { type: "pair"; scale: number; goal: number; goalLabel: string; items: { label: string; value: number; on?: boolean }[] };
type RingChart = Base & { type: "rings"; items: { label: string; value: number }[] };
type ScaleChart = Base & { type: "scale"; max: number; marks: { label: string; value: number }[]; items: { label: string; value: number }[] };
type QuotesChart = Base & { type: "quotes"; items: { name: string; quote: string; source: string; sourceUrl?: string }[] };
type TableChart = Base & { type: "table"; max: number; people: string[]; rows: { label: string; values: number[] }[] };
export type StageChart = DonutChart | BarChart | PairChart | RingChart | ScaleChart | QuotesChart | TableChart;

function ChartSource({ source }: { source?: Source }) {
  if (!source) return null;
  return (
    <p className="dv-chart-source">
      {source.url ? <a className="dv-source-link" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}
      {source.detail ? ` · ${source.detail}` : ""}
    </p>
  );
}

const GAP = 0.7; // Between ring segments, in hundredths of the ring.
const SHOW_MS = 4500; // How long each chart stays; the progress ring on its tab is the timer.
const LEAVE_MS = 280;

// Counts up from 0 while its chart plays. The final value is what renders otherwise.
function Count({ value, animate, delay = 0, suffix = "%" }: { value: number; animate: boolean; delay?: number; suffix?: string }) {
  const [shown, setShown] = useState(animate ? 0 : value);
  useEffect(() => {
    if (!animate) { setShown(value); return; }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(Math.max(now - start, 0) / 1000, 1);
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, value, delay]);
  const decimals = Number.isInteger(value) ? 0 : 1;
  return <>{shown.toFixed(decimals)}{suffix}</>;
}

function Donut({ data, animate }: { data: DonutChart; animate: boolean }) {
  const mask = `dv-trust-sweep-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [active, setActive] = useState<number | null>(null);
  const total = data.segments.reduce((sum, s) => sum + s.value, 0);
  let start = 0;
  const parts = data.segments.map((s, i) => {
    const share = (s.value / total) * 100;
    const part = { ...s, i, start, share };
    start += share;
    return part;
  });
  const current = active === null ? null : data.segments[active];

  return (
    <div className="dv-trust-wrap">
      <div className="dv-trust" data-active={active === null ? undefined : true}>
        <svg viewBox="20 20 160 160" aria-hidden="true">
          <defs>
            {/* The sweep: one wide stroke drawing round, wider than the ring so the glow survives. */}
            <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <circle className="dv-trust-mask" cx="100" cy="100" r="66" pathLength={100} />
            </mask>
          </defs>
          <g mask={`url(#${mask})`}>
            {parts.map((p) => (
              <circle
                key={p.label}
                className="dv-trust-seg"
                data-on={p.on || undefined}
                data-rest={p.rest || undefined}
                data-current={active === p.i || undefined}
                cx="100"
                cy="100"
                r="66"
                pathLength={100}
                strokeDasharray={`${Math.max(p.share - GAP, 0.2)} 100`}
                strokeDashoffset={-p.start}
                onMouseEnter={() => setActive(p.i)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
            {/* Every segment starts in the case colour: what doesn't carry the finding fades to
                its grey. An overlay, because animating stroke through color-mix drew neon green. */}
            {parts.filter((p) => !p.on).map((p) => (
              <circle
                key={p.label}
                className="dv-trust-flash"
                cx="100"
                cy="100"
                r="66"
                pathLength={100}
                strokeDasharray={`${Math.max(p.share - GAP, 0.2)} 100`}
                strokeDashoffset={-p.start}
              />
            ))}
          </g>
        </svg>
        <p className="dv-trust-center" aria-hidden="true">
          <strong>{current ? `${current.value}%` : <Count value={parseFloat(data.value)} animate={animate} />}</strong>
          <span>{current ? current.label : data.valueLabel}</span>
        </p>
      </div>
      <ul className="dv-trust-legend" onMouseLeave={() => setActive(null)}>
        {parts.map((p) => (
          <li key={p.label} style={{ "--i": p.i } as React.CSSProperties}>
            <button
              type="button"
              data-on={p.on || undefined}
              data-rest={p.rest || undefined}
              data-current={active === p.i || undefined}
              onMouseEnter={() => setActive(p.i)}
              onFocus={() => setActive(p.i)}
              onBlur={() => setActive(null)}
            >
              <i aria-hidden="true" />
              <span>{p.label}</span>
              <b>{p.value}%</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ data, animate }: { data: BarChart; animate: boolean }) {
  const top = Math.max(...data.bars.map((b) => b.value));
  return (
    <ul className="dv-bars-chart">
      {data.bars.map((bar, i) => (
        <li key={bar.label} data-top={bar.value === top || undefined} style={{ "--i": i } as React.CSSProperties}>
          <div className="dv-bar-track">
            <strong><Count value={bar.value} animate={animate} delay={i * 110} /></strong>
            <i aria-hidden="true" style={{ "--r": bar.value / top } as React.CSSProperties} />
          </div>
          <span>{bar.label}</span>
        </li>
      ))}
    </ul>
  );
}

function Pair({ data, animate }: { data: PairChart; animate: boolean }) {
  return (
    <div className="dv-pair" style={{ "--goal": data.goal / data.scale } as React.CSSProperties}>
      <div className="dv-pair-plot">
        <span className="dv-pair-goal"><b>{data.goalLabel}</b></span>
        {data.items.map((item, i) => (
          <div key={item.label} className="dv-pair-bar" data-on={item.on || undefined} style={{ "--i": i, "--r": item.value / data.scale } as React.CSSProperties}>
            <strong><Count value={item.value} animate={animate} delay={i * 200} suffix="" /></strong>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="dv-pair-labels">{data.items.map((item) => <span key={item.label} data-on={item.on || undefined}>{item.label}</span>)}</div>
    </div>
  );
}

function Rings({ data, animate }: { data: RingChart; animate: boolean }) {
  return (
    <ul className="dv-sus">
      {data.items.map((item, i) => (
        <li key={item.label} style={{ "--i": i } as React.CSSProperties}>
          <div className="dv-sus-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="dv-sus-track" cx="50" cy="50" r="42" pathLength={100} />
              <circle className="dv-sus-value" cx="50" cy="50" r="42" pathLength={100} style={{ "--v": item.value } as React.CSSProperties} />
            </svg>
            <strong><Count value={item.value} animate={animate} suffix="" /></strong>
          </div>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

// One 0–max line with the reference marks (goal, usual average) and a dot per
// person, so the chart shows where each score sits instead of repeating it.
function ScaleView({ data }: { data: ScaleChart }) {
  const at = (v: number) => ({ "--x": `${(v / data.max) * 100}%` }) as React.CSSProperties;
  return (
    <div className="dv-scale">
      <div className="dv-scale-line">
        <span className="dv-scale-end">0</span>
        {data.marks.map((m) => <span key={m.label} className="dv-scale-mark" style={at(m.value)}><b>{m.label}</b></span>)}
        {data.items.map((item, i) => (
          <span key={item.label} className="dv-scale-dot" style={{ ...at(item.value), "--i": i } as React.CSSProperties}>
            <i aria-hidden="true" />
            <b>{item.label}</b><small>{item.value}</small>
          </span>
        ))}
        <span className="dv-scale-end" data-end>{data.max}</span>
      </div>
    </div>
  );
}

// Community posts as a chart-stage panel: each problem with one real quote and its source.
function QuotesView({ data }: { data: QuotesChart }) {
  return (
    <ul className="dv-qv">
      {data.items.map((item, i) => (
        <li key={item.name} style={{ "--i": i } as React.CSSProperties}>
          <strong>{item.name}</strong>
          <blockquote>“{item.quote}”</blockquote>
          <cite>{item.sourceUrl ? <a className="dv-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a> : item.source}</cite>
        </li>
      ))}
    </ul>
  );
}

function TableView({ data }: { data: TableChart }) {
  return (
    <table className="dv-score-table">
      <thead>
        <tr><td />{data.people.map((person) => <th key={person} scope="col">{person}</th>)}</tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={row.label} style={{ "--i": i } as React.CSSProperties}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, who) => <td key={who}>
              <span className="dv-score-cell">
                <span className="dv-score-dots" aria-hidden="true">{Array.from({ length: data.max }, (_, d) => <i key={d} data-on={d < value || undefined} />)}</span>
                <span><strong>{value}</strong><small> / {data.max}</small></span>
              </span>
            </td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// One large chart at a time: word tabs on top, then one tinted plate with the finding at the left
// and the chart at the right. Each chart draws itself, holds, and hands over to the next, round and
// round, while it's on screen; the fill inside the current tab is the timer. Pointer or keyboard
// focus holds it, the button stops it, tabs pick a chart. Every panel stays in one grid cell, so
// the box keeps the height of the tallest and nothing below it moves. With reduced motion or no
// JS the first chart stands complete and the tabs still work.
// `head` (the block's label and finding) sits inside the held stage, so it stays on
// screen with the chart while scroll changes the chart (owner: the title scrolled away).
export function SurveyCharts({ charts, labels, head }: { charts: StageChart[]; labels: { charts: string; pause: string; play: string }; head?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [motion, setMotion] = useState(false);
  const [seen, setSeen] = useState(false);
  const [inView, setInView] = useState(false);
  const [hold, setHold] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [current, setCurrent] = useState(0);
  const [round, setRound] = useState(0);
  // With room and motion the stage holds on screen and native scroll picks the chart (no timer).
  const held = useHeldSteps(charts.length, head ? TALL_PIN : undefined);
  const scrolled = held.pinned;

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setMotion(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const go = useCallback((pick: (i: number) => number) => {
    window.clearTimeout(timer.current);
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setCurrent(pick);
      setRound((r) => r + 1);
      setLeaving(false);
    }, LEAVE_MS);
  }, []);

  useEffect(() => {
    if (scrolled && held.active !== current) go(() => held.active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held.active, scrolled]);

  const phase = !motion ? "final" : seen ? "play" : "wait";
  const running = motion && inView && !hold && !stopped && !leaving && !scrolled;

  return (
    <div ref={held.root} className={`dv-held-track dv-cycle-track${head ? " dv-held-tall" : ""}`} style={{ "--n": charts.length } as React.CSSProperties}>
    <div
      ref={root}
      className="dv-cycle-stage"
      data-run={running || undefined}
      data-leaving={leaving || undefined}
      style={{ "--show-ms": `${SHOW_MS}ms` } as React.CSSProperties}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      {head && <div className="dv-cycle-head">{head}</div>}
      <div className="dv-cycle-nav">
        <div role="group" aria-label={labels.charts} className="dv-cycle-tabs">
          {charts.map((chart, i) => (
            <button key={chart.tab} type="button" className="press" aria-pressed={i === current} onClick={() => { if (scrolled) held.go(i); else if (i !== current) go(() => i); }}>
              {i === current && motion && !scrolled && <i key={round} className="dv-cycle-timer" aria-hidden="true" onAnimationEnd={() => go((c) => (c + 1) % charts.length)} />}
              <span>{chart.tab}</span>
            </button>
          ))}
        </div>
        {motion && !scrolled && (
          <button type="button" className="dv-cycle-stop" aria-label={stopped ? labels.play : labels.pause} onClick={() => setStopped((v) => !v)}>
            <svg viewBox="0 0 20 20" aria-hidden="true">{stopped ? <path d="M7 4.5v11l9-5.5z" fill="currentColor" /> : <path d="M7 4.5v11M13 4.5v11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />}</svg>
          </button>
        )}
      </div>
      <div className="dv-cycle-plate">
        <div className="dv-cycle-stack dv-cycle-texts">
          {charts.map((chart, i) => (
            <div key={i} className="dv-cycle-text" data-on={i === current || undefined} aria-hidden={i !== current || undefined} inert={i !== current || undefined}>
              <p>{chart.title}</p>
            </div>
          ))}
        </div>
        <div className="dv-cycle-stack dv-cycle-charts">
          {charts.map((chart, i) => {
            const on = i === current;
            return (
              <div key={on ? `${i}-${round}` : i} className="dv-cycle-panel" data-on={on || undefined} data-phase={on ? phase : "final"} aria-hidden={!on || undefined} inert={!on || undefined}>
                {chart.type === "donut" && <Donut data={chart} animate={on && phase === "play"} />}
                {chart.type === "bars" && <Bars data={chart} animate={on && phase === "play"} />}
                {chart.type === "pair" && <Pair data={chart} animate={on && phase === "play"} />}
                {chart.type === "rings" && <Rings data={chart} animate={on && phase === "play"} />}
                {chart.type === "scale" && <ScaleView data={chart} />}
                {chart.type === "quotes" && <QuotesView data={chart} />}
                {chart.type === "table" && <TableView data={chart} />}
              </div>
            );
          })}
        </div>
      </div>
      {/* The note and the source sit small under the chart, not beside the finding (owner). */}
      {(charts[current].note || charts[current].source) && <div className="dv-cycle-foot">
        {charts[current].note && <p className="dv-chart-source">{charts[current].note}</p>}
        <ChartSource source={charts[current].source} />
      </div>}
    </div>
    </div>
  );
}
