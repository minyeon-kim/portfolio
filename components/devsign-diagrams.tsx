// The information architecture and the user flow, drawn in code so their text is real
// text at reading size, in the page's language and theme. The words live in the case
// MDX (develop.ia.tree, develop.flow.chart); the layout lives here.

// An item is [name, ...children].
type IaColumn = { label?: string; items: string[][] };
type IaGroup = { name: string; main?: boolean; columns: IaColumn[] };
export type IaTreeData = { root: string; groups: IaGroup[] };

export function IaTree({ tree }: { tree: IaTreeData }) {
  return (
    <div className="dv-ia dv-gap-40 reveal">
      <p className="dv-ia-root">{tree.root}</p>
      <ul className="dv-ia-groups">
        {tree.groups.map((group) => (
          <li key={group.name} className="dv-ia-group" data-main={group.main || undefined}>
            <h4>{group.name}</h4>
            <div className="dv-ia-columns">
              {group.columns.map((column, c) => (
                <div key={column.label ?? c}>
                  {column.label && <p className="dv-ia-label">{column.label}</p>}
                  <ul className="dv-ia-items">
                    {column.items.map(([name, ...children]) => (
                      <li key={name}>
                        <span className="dv-ia-node">{name}</span>
                        {children.length > 0 && <ul>{children.map((child) => <li key={child}>{child}</li>)}</ul>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type FlowChartData = {
  meet: string;
  steps: { who: string; text: string; shared?: boolean }[];
  foot: string;
};

// The user flow as a row of plain steps: who, then what they do. The person changing from one
// step to the next is the handoff, and the one accent marks the screen they share.
export function FlowChart({ chart }: { chart: FlowChartData }) {
  const start = chart.steps.findIndex((step) => step.shared) + 1;
  const span = chart.steps.filter((step) => step.shared).length;
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <p className="dv-fc-meet" style={{ gridColumn: `${start} / span ${span}` }}>{chart.meet}</p>
      <ol className="dv-fc-steps">
        {chart.steps.map((step, i) => (
          <li key={step.text} data-shared={step.shared || undefined}>
            <span className="dv-fc-who"><b>{i + 1}</b>{step.who}</span>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="dv-fc-foot">{chart.foot}</p>
    </div>
  );
}
