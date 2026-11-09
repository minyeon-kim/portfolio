type Item = { tone: string; label: string; title: string; text?: string; accent?: string };

// The Overview summary: Problem, Solution and Impact all in view at once (owner: no scroll steps),
// as hairline rows, label at the left and the sentence beside it on desktop.
export function GlanceSteps({ items, label }: { items: Item[]; label: string }) {
  return (
    <div className="dv-gs">
      <ol className="dv-gs-list" aria-label={label}>
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
