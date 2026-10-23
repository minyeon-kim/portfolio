import { T } from "./local-text";
import type { ReactNode } from "react";

// Numbers, findings, the process diagram and comparisons set as text, so a case reads in
// cards and short lines instead of long lists, and secondary research is
// cited rather than shown as someone else's chart.

// Every number cites its source right under it.
export function CaseStats({ items, source }: { items: { value: string; label: string; source?: string }[]; source?: string }) {
  return (
    <figure className="case-stats reveal">
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            {item.source && <cite>{item.source}</cite>}
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {source && <figcaption>{source}</figcaption>}
    </figure>
  );
}

type Finding = { label?: string; title: string; body?: string; points?: string[] };

export function CaseFindings({ title, items }: { title?: string; items: Finding[] }) {
  return (
    <section className="case-findings reveal" aria-label={title}>
      {title && <p className="case-findings-title">{title}</p>}
      <div className="case-findings-grid">
        {items.map((item) => (
          <div key={item.title} className="case-findings-card">
            {item.label && <p className="case-findings-label">{item.label}</p>}
            <h3>{item.title}</h3>
            {item.body && <p>{item.body}</p>}
            {item.points && (
              <ul>
                {item.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CaseCompare({ before, after, rows }: { before: string; after: string; rows: { topic?: string; before: string; after: string }[] }) {
  return (
    <div className="case-compare reveal" role="table" aria-label={`${before} and ${after}`}>
      <div className="case-compare-row case-compare-head" role="row">
        <span role="columnheader">{before}</span>
        <span role="columnheader">{after}</span>
      </div>
      {rows.map((row) => (
        <div key={row.after} className="case-compare-row" role="row">
          <span role="cell">{row.topic && <em>{row.topic}</em>}{row.before}</span>
          <span role="cell">{row.after}</span>
        </div>
      ))}
    </div>
  );
}

// The one line per stage a skimming reader should take away.
export function CaseKey({ children }: { children: ReactNode }) {
  return <p className="case-key reveal">{children}</p>;
}

type DiamondPhase = { label: string; title: string; methods?: string[]; steps?: string[]; output?: string; body?: string };

// The Double Diamond drawn out in the "revamped" style: each diamond diverges,
// then converges; every method used in a phase is a numbered mark on the line,
// listed underneath with what the phase handed on to the next.
export function CaseDiamond({ items }: { items: DiamondPhase[] }) {
  const marks = items.flatMap((item, p) => {
    const n = item.steps?.length ?? 0;
    return Array.from({ length: n }, (_, i) => ({ key: `${p}-${i}`, x: p * 200 + ((i + 1) * 200) / (n + 1), n: i + 1 }));
  });
  return (
    <figure className="case-diamond reveal">
      <div className="case-diamond-spaces" aria-hidden="true"><span><T k="rightThing" /></span><span><T k="thingsRight" /></span></div>
      <div className="case-diamond-figure">
        <svg viewBox="0 0 800 300" role="img" aria-label={items.map((item) => item.label).join(", ")}>
          <line x1="0" y1="150" x2="800" y2="150" />
          <polygon points="0,150 200,4 400,150 200,296" />
          <polygon points="400,150 600,4 800,150 600,296" />
          {[0, 400].map((x) => (
            <g key={x} className="case-diamond-edge">
              <text x={x + 92} y={62} transform={`rotate(-36 ${x + 92} 62)`} textAnchor="middle"><T k="diverge" /></text>
              <text x={x + 308} y={62} transform={`rotate(36 ${x + 308} 62)`} textAnchor="middle"><T k="converge" /></text>
            </g>
          ))}
          {items.map((item, p) => (
            <text key={item.label} className="case-diamond-phase" x={p * 200 + 100} y={118} textAnchor="middle">{item.label}</text>
          ))}
          {marks.map((m) => (
            <g key={m.key} className="case-diamond-mark">
              <circle cx={m.x} cy={150} r={10} />
              <text x={m.x} y={154} textAnchor="middle">{m.n}</text>
            </g>
          ))}
        </svg>
      </div>
      <ol className="case-diamond-notes">
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            {item.methods ? (
              <ul className="case-diamond-methods" aria-label="Methods">
                {item.methods.map((m) => <li key={m}>{m}</li>)}
              </ul>
            ) : null}
            {item.steps ? (
              <ol className="case-diamond-steps">
                {item.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            ) : null}
            {item.body && <p>{item.body}</p>}
            {item.output && <p className="case-diamond-output"><span aria-hidden="true">→</span> {item.output}</p>}
          </li>
        ))}
      </ol>
    </figure>
  );
}
