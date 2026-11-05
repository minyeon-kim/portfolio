"use client";

import { useEffect, useId, useRef, useState } from "react";

type Segment = { label: string; value: number; on?: boolean; rest?: boolean };
type Bar = { label: string; value: number };
type Source = { label: string; url?: string; detail?: string };
type DonutChart = { type: "donut"; title: string; value: string; valueLabel: string; segments: Segment[]; source?: Source };
type BarChart = { type: "bars"; title: string; note?: string; bars: Bar[]; source?: Source };
type SurveyChart = DonutChart | BarChart;

function ChartSource({ source }: { source?: Source }) {
  if (!source) return null;
  return (
    <p className="dv-chart-source">
      {source.url ? <a className="dv-source-link" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}
      {source.detail ? ` · ${source.detail}` : ""}
    </p>
  );
}

// Drawn once, when half the block is on screen. Before that (and without JS or with reduced
// motion, where `wait` is never set) the final picture shows, so nothing depends on the script.
function usePlayOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"final" | "wait" | "play">("final");
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const box = el.getBoundingClientRect();
    if (box.bottom < 0) return; // Already scrolled past: leave it drawn.
    setPhase("wait");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPhase("play");
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, phase };
}

const GAP = 0.7; // Between ring segments, in hundredths of the ring.

function Donut({ data }: { data: DonutChart }) {
  const mask = `dv-trust-sweep-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [active, setActive] = useState<number | null>(null);
  const total = data.segments.reduce((sum, s) => sum + s.value, 0);
  let start = 0;
  const parts = data.segments.map((s, i) => {
    const share = (s.value / total) * 100;
    const part = { ...s, i, start, share, mid: start + share / 2 };
    start += share;
    return part;
  });
  const current = active === null ? null : data.segments[active];

  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <div className="dv-trust" data-active={active === null ? undefined : true}>
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            {/* The sweep: one wide stroke drawing round, wider than the ring so the glow survives. */}
            <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <circle className="dv-trust-mask" cx="100" cy="100" r="66" pathLength={100} />
            </mask>
          </defs>
          <circle className="dv-trust-dots" cx="100" cy="100" r="50" />
          <g mask={`url(#${mask})`}>
            {parts.map((p) => (
              <circle
                key={p.label}
                className="dv-trust-seg"
                data-on={p.on || undefined}
                data-rest={p.rest || undefined}
                data-first={p.i === 0 || undefined}
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
        {parts.map((p) => {
          const angle = (p.mid / 100) * Math.PI * 2;
          return (
            <span
              key={p.label}
              className="dv-trust-pct"
              data-on={p.on || undefined}
              data-current={active === p.i || undefined}
              aria-hidden="true"
              style={{ left: `${50 + Math.sin(angle) * 47.5}%`, top: `${50 - Math.cos(angle) * 47.5}%` }}
            >
              {p.value}%
            </span>
          );
        })}
        <p className="dv-trust-center" aria-hidden="true">
          <strong>{current ? `${current.value}%` : data.value}</strong>
          <span>{current ? current.label : data.valueLabel}</span>
        </p>
      </div>
      <ul className="dv-trust-legend" onMouseLeave={() => setActive(null)}>
        {parts.map((p) => (
          <li key={p.label}>
            <button
              type="button"
              data-on={p.on || undefined}
              data-rest={p.rest || undefined}
              data-first={p.i === 0 || undefined}
              onMouseEnter={() => setActive(p.i)}
              onFocus={() => setActive(p.i)}
              onBlur={() => setActive(null)}
            >
              <i aria-hidden="true" />
              {p.label}
              <span className="sr-only"> {p.value}%</span>
            </button>
          </li>
        ))}
      </ul>
      <ChartSource source={data.source} />
    </figure>
  );
}

function Bars({ data }: { data: BarChart }) {
  const top = Math.max(...data.bars.map((b) => b.value));
  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <ul className="dv-bars-chart">
        {data.bars.map((bar, i) => (
          <li key={bar.label} data-top={bar.value === top || undefined} style={{ "--i": i } as React.CSSProperties}>
            <div className="dv-bar-track">
              <strong>{bar.value}%</strong>
              <i aria-hidden="true" style={{ "--r": bar.value / top } as React.CSSProperties} />
            </div>
            <span>{bar.label}</span>
          </li>
        ))}
      </ul>
      <p className="dv-chart-note">{data.note}</p>
      <ChartSource source={data.source} />
    </figure>
  );
}

export function SurveyCharts({ charts }: { charts: SurveyChart[] }) {
  const { ref, phase } = usePlayOnce();
  return (
    <div ref={ref} className="dv-charts" data-phase={phase}>
      {charts.map((chart) => chart.type === "donut" ? <Donut key={chart.title} data={chart} /> : <Bars key={chart.title} data={chart} />)}
    </div>
  );
}

/* Usability results, from the test workbook. The numbers are small (2 people), so every value
   is shown as itself, per person, never as a percentage. */
type HelpChart = {
  title: string; first: string; second: string; goal: number; goalLabel: string; note?: string; scale: number;
  groups: { label: string; tasks: { label: string; first: number; second: number }[] }[];
};
type SusChart = { title: string; items: { label: string; value: number }[]; marks: { value: number; label: string }[]; note?: string };
type DotChart = { title: string; max: number; people: string[]; rows: { label: string; values: number[] }[]; note?: string };
export type UsabilityChartData = { help?: HelpChart; sus: SusChart; dots: DotChart };

function HelpBars({ data }: { data: HelpChart }) {
  let i = 0;
  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <div className="dv-help-scroll">
        <div className="dv-help" style={{ "--goal": data.goal / data.scale } as React.CSSProperties}>
          {data.groups.map((group) => (
            <div key={group.label} className="dv-help-group" style={{ "--n": group.tasks.length } as React.CSSProperties}>
              <p>{group.label}</p>
              <ul>
                {group.tasks.map((task) => {
                  const order = i++;
                  return (
                    <li key={task.label} style={{ "--i": order } as React.CSSProperties}>
                      <div className="dv-help-pair">
                        <span data-try="first"><strong>{task.first}</strong><i aria-hidden="true" style={{ "--r": task.first / data.scale } as React.CSSProperties} /><em className="sr-only">{data.first}</em></span>
                        <span data-try="second"><strong>{task.second}</strong><i aria-hidden="true" style={{ "--r": task.second / data.scale } as React.CSSProperties} /><em className="sr-only">{data.second}</em></span>
                      </div>
                      <small>{task.label}</small>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <ul className="dv-help-legend" aria-hidden="true"><li data-try="first">{data.first}</li><li data-try="second">{data.second}</li><li data-try="goal">{data.goalLabel}</li></ul>
      {data.note && <p className="dv-chart-note">{data.note}</p>}
    </figure>
  );
}

function SusRings({ data }: { data: SusChart }) {
  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <ul className="dv-sus">
        {data.items.map((item) => (
          <li key={item.label}>
            <div className="dv-sus-ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="dv-sus-track" cx="50" cy="50" r="42" pathLength={100} />
                <circle className="dv-sus-value" cx="50" cy="50" r="42" pathLength={100} style={{ "--v": item.value } as React.CSSProperties} />
                {data.marks.map((mark) => (
                  <line key={mark.value} className="dv-sus-mark" x1="50" y1="2" x2="50" y2="14" transform={`rotate(${mark.value * 3.6 + 90} 50 50)`} />
                ))}
              </svg>
              <strong>{item.value}</strong>
            </div>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="dv-chart-note">{data.marks.map((mark) => mark.label).join(" · ")}{data.note ? `. ${data.note}` : ""}</p>
    </figure>
  );
}

function DotRows({ data }: { data: DotChart }) {
  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <ul className="dv-dots">
        {data.rows.map((row) => (
          <li key={row.label}>
            <span className="dv-dots-label">{row.label}</span>
            <span className="dv-dots-track" aria-hidden="true" style={{ "--max": data.max } as React.CSSProperties}>
              {Array.from({ length: data.max }, (_, n) => <i key={n} />)}
              {row.values.map((value, who) => (
                <b key={who} data-who={who} data-tie={row.values.filter((v) => v === value).length > 1 || undefined} style={{ "--at": (value - 1) / (data.max - 1) } as React.CSSProperties} />
              ))}
            </span>
            <span className="dv-dots-values">
              {row.values.map((value, who) => <span key={who}><span className="sr-only">{data.people[who]} </span>{value}{who < row.values.length - 1 ? " · " : ""}</span>)}
            </span>
          </li>
        ))}
      </ul>
      <ul className="dv-help-legend dv-dots-legend" aria-hidden="true">{data.people.map((person, who) => <li key={person} data-who={who}>{person}</li>)}</ul>
      {data.note && <p className="dv-chart-note">{data.note}</p>}
    </figure>
  );
}

export function UsabilityCharts({ charts }: { charts: UsabilityChartData }) {
  const { ref, phase } = usePlayOnce();
  return (
    <div ref={ref} className="dv-ut-charts" data-phase={phase} data-split={charts.help ? undefined : true}>
      {charts.help ? (
        <>
          <HelpBars data={charts.help} />
          <div className="dv-ut-side"><SusRings data={charts.sus} /><DotRows data={charts.dots} /></div>
        </>
      ) : (
        <>
          <SusRings data={charts.sus} />
          <div className="dv-ut-side"><DotRows data={charts.dots} /></div>
        </>
      )}
    </div>
  );
}
