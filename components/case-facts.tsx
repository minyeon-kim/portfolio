// Numbers and findings set as text, so secondary research is cited rather
// than shown as someone else's chart, and dense boards read as a summary.

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

export function CaseFindings({ title, items }: { title?: string; items: { title: string; points: string[] }[] }) {
  return (
    <section className="case-findings reveal" aria-label={title}>
      {title && <p className="case-findings-title">{title}</p>}
      <div className="case-findings-grid">
        {items.map((item) => (
          <div key={item.title} className="case-findings-card">
            <h3>{item.title}</h3>
            <ul>
              {item.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
