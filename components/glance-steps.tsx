type Item = { tone: string; label: string; title: string; text?: string };

// The Overview summary: Problem, Solution and Impact all in view at once (owner: no scroll steps),
// as hairline rows, label at the left and the sentence beside it on desktop.
export function GlanceSteps({ items, label }: { items: Item[]; label: string }) {
  return (
    <div className="dv-gs">
      <ol className="dv-gs-list" aria-label={label}>
        {items.map((item, i) => (
          <li key={item.label} data-tone={item.tone} data-on>
            <p className="dv-gs-name"><b>{String(i + 1).padStart(2, "0")}</b>{item.label}</p>
            <div className="dv-gs-body">
              <p className="dv-gs-title">{item.title}</p>
              {item.text && <p className="dv-gs-text">{item.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
