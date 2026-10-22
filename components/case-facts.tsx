import type { ReactNode } from "react";

// Numbers, findings, steps and comparisons set as text, so a case reads in
// cards and short lines instead of long lists, and secondary research is
// cited rather than shown as someone else's chart.

export function CaseStats({ items, source }: { items: { value: string; label: string }[]; source?: string }) {
  return (
    <figure className="case-stats reveal">
      <dl>
        {items.map((item) => (
          <div key={item.label}>
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

export function CaseSteps({ items }: { items: { label: string; title: string; body: string }[] }) {
  return (
    <ol className="case-steps reveal">
      {items.map((item) => (
        <li key={item.label}>
          <span className="case-steps-label">{item.label}</span>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </li>
      ))}
    </ol>
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
