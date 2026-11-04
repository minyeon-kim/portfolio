import Image from "next/image";
import { withBase } from "@/lib/site";

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
  image: { src: string; width: number; height: number; alt: string };
  // Phones get the same flow as text: the image would be too small to read.
  list: { who: string; items: string[] }[];
  full: { src: string; label: string };
};

// The user flow is drawn in Figma ("Devsign · User flow · KO / EN" on the Devsign page) and exported at 2x.
export function FlowChart({ chart }: { chart: FlowChartData }) {
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <Image src={withBase(chart.image.src)} alt={chart.image.alt} width={chart.image.width} height={chart.image.height} sizes="(min-width: 72rem) min(1640px, 100vw - 96px), 1280px" />
      </div>
      <ol className="dv-fc-list">
        {chart.list.map((group, i) => (
          <li key={`${group.who}-${i}`}>
            <h4>{group.who}</h4>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </li>
        ))}
      </ol>
      <a className="link dv-fc-full" href={withBase(chart.full.src)} target="_blank" rel="noreferrer">{chart.full.label}</a>
    </div>
  );
}
