type Item = { tone: string; label: string; title: string; text?: string; accent?: string };

// The Overview summary: Problem, Solution and Impact all in view at once (owner: no scroll steps),
// as hairline rows, label at the left and the sentence beside it on desktop.
type Context = { label: string; text: string; source: { label: string; url: string } };

export function GlanceSteps({ items, label, context }: { items: Item[]; label: string; context?: Context }) {
  return (
    <div className="dv-gs">
      <ol className="dv-gs-list" aria-label={label}>
        {/* Background first, quieter than the three rows it leads into. */}
        {context && (
          <li className="dv-gs-context">
            <p className="dv-gs-name">{context.label}</p>
            <div className="dv-gs-body">
              <p className="dv-gs-ctx">{context.text}</p>
              <a className="dv-gs-src" href={context.source.url} target="_blank" rel="noreferrer">{context.source.label} ↗</a>
            </div>
          </li>
        )}
        {items.map((item) => (
          <li key={item.label} data-tone={item.tone} data-on>
            <p className="dv-gs-name">{item.label}</p>
            <div className="dv-gs-body">
              <p className="dv-gs-title">{item.accent && item.title.includes(item.accent)
                ? <>{item.title.split(item.accent)[0]}<span className="dv-gs-accent">{item.accent}</span>{item.title.split(item.accent)[1]}</>
                : item.title}</p>
              {item.text && <p className="dv-gs-text">{item.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
