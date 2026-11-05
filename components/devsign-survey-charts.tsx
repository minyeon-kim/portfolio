"use client";

import { useEffect, useRef, useState } from "react";

type Segment = { label: string; value: number; on?: boolean; rest?: boolean };
type Bar = { label: string; value: number };
export type SurveyChartData = {
  trust: { title: string; value: string; valueLabel: string; segments: Segment[] };
  frustrations: { title: string; note: string; bars: Bar[] };
};

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

function Donut({ data }: { data: SurveyChartData["trust"] }) {
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
            <mask id="dv-trust-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
              <circle className="dv-trust-mask" cx="100" cy="100" r="66" pathLength={100} />
            </mask>
          </defs>
          <circle className="dv-trust-dots" cx="100" cy="100" r="50" />
          <g mask="url(#dv-trust-sweep)">
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
    </figure>
  );
}

function Bars({ data }: { data: SurveyChartData["frustrations"] }) {
  const top = Math.max(...data.bars.map((b) => b.value));
  return (
    <figure className="dv-chart">
      <figcaption>{data.title}</figcaption>
      <ul className="dv-bars-chart">
        {data.bars.map((bar, i) => (
          <li key={bar.label} data-top={bar.value === top || undefined} style={{ "--i": i } as React.CSSProperties}>
            <div className="dv-bar-track">
              <strong>{bar.value}%</strong>
              <i aria-hidden="true" style={{ height: `${(bar.value / top) * 100}%` }} />
            </div>
            <span>{bar.label}</span>
          </li>
        ))}
      </ul>
      <p className="dv-chart-note">{data.note}</p>
    </figure>
  );
}

export function SurveyCharts({ charts }: { charts: SurveyChartData }) {
  const { ref, phase } = usePlayOnce();
  return (
    <div ref={ref} className="dv-charts" data-phase={phase}>
      <Donut data={charts.trust} />
      <Bars data={charts.frustrations} />
    </div>
  );
}
