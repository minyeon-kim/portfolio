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

// The Double Diamond drawn out: two diamonds (problem, then solution) with the
// four phases on them, and what each phase found underneath.
export function CaseDiamond({ items }: { items: { label: string; title: string; body: string }[] }) {
  return (
    <figure className="case-diamond reveal">
      <div className="case-diamond-spaces" aria-hidden="true"><span>Problem</span><span>Solution</span></div>
      <div className="case-diamond-figure">
        <svg viewBox="0 0 800 180" role="img" aria-label="Double Diamond: Discover and Define, then Develop and Deliver">
          <line x1="0" y1="90" x2="800" y2="90" />
          <polygon points="0,90 200,4 400,90 200,176" />
          <polygon points="400,90 600,4 800,90 600,176" />
        </svg>
        <ol className="case-diamond-phases" aria-hidden="true">
          {items.map((item) => <li key={item.label}>{item.label}</li>)}
        </ol>
      </div>
      <ol className="case-diamond-notes">
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </li>
        ))}
      </ol>
    </figure>
  );
}
