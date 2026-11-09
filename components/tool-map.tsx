import Image from "next/image";
import { withBase } from "@/lib/site";

// Comparative analysis as a capability map: what a tool does with a change, and what it keeps
// about the decision. It is a classification by whether a feature exists, not a measured graph,
// so the cells are fixed criteria. Sources for every placement: docs/tool-research.md.
// Colour marks are each product's own icon, from its official site.
type Tool = { name: string; icon?: string; x: number; y: number };
export type ToolMapData = { xTitle: string; yTitle: string; xLabels: string[]; yLabels: string[]; tools: Tool[]; empty: string; note: string };

export function ToolMap({ map }: { map: ToolMapData }) {
  const ys = [2, 1, 0];
  const xs = [0, 1, 2, 3];
  return (
    <figure className="dv-tm-map reveal">
      <p className="dv-tm-axis">{map.yTitle} ↑</p>
      <div className="dv-tm-scroll"><div className="dv-tm-grid">
        {ys.map((y) => (
          <div key={y} className="dv-tm-row">
            <p className="dv-tm-ylabel">{map.yLabels[y]}</p>
            {xs.map((x) => {
              const tools = map.tools.filter((t) => t.x === x && t.y === y);
              if (x === 3 && y === 2) return <div key={x} className="dv-tm-cell" data-empty=""><span>{map.empty}</span></div>;
              return (
                <ul key={x} className="dv-tm-cell">
                  {tools.map((t) => (
                    <li key={t.name}>
                      <span className="dv-tm-icon" aria-hidden="true">{t.icon ? <Image src={withBase(`/images/tools/${t.icon}.webp`)} alt="" width={24} height={24} /> : t.name[0]}</span>
                      {t.name}
                    </li>
                  ))}
                </ul>
              );
            })}
          </div>
        ))}
        <div className="dv-tm-row dv-tm-xrow">
          <span />
          {map.xLabels.map((label) => <p key={label}>{label}</p>)}
        </div>
      </div></div>
      <p className="dv-tm-axis" data-x="">{map.xTitle} →</p>
      <figcaption className="dv-tm-note">{map.note}</figcaption>
    </figure>
  );
}
