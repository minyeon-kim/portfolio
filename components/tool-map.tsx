import Image from "next/image";
import { withBase } from "@/lib/site";

// Comparative analysis as one comparison: how tools handle the two things the finding is about,
// against Devsign. Each way is a phrase with the tools that work that way, so no legend is needed.
// Sources: docs/tool-research.md. Colour marks are each product's own icon, from its official site.
type Tool = { name: string; icon: string };
type Way = { label: string; tools: Tool[] };
type Row = { name: string; ways: Way[]; self: string };
export type CoverageData = { today: string; selfName: string; selfTag: string; lead: string; leadTools: Tool[]; rows: Row[]; note: string };

function Tools({ tools }: { tools: Tool[] }) {
  return (
    <ul className="dv-cmp-tools">
      {tools.map((t) => (
        <li key={t.name}>
          <span className="dv-tm-icon" aria-hidden="true"><Image src={withBase(`/images/tools/${t.icon}.webp`)} alt="" width={24} height={24} /></span>
          {t.name}
        </li>
      ))}
    </ul>
  );
}

export function ToolMap({ map }: { map: CoverageData }) {
  return (
    <figure className="dv-cmp reveal">
      <div className="dv-cmp-lead"><p>{map.lead}</p><Tools tools={map.leadTools} /></div>
      <table>
        <thead>
          <tr><td /><th scope="col">{map.today}</th><th scope="col" data-self="">{map.selfName}<small>{map.selfTag}</small></th></tr>
        </thead>
        <tbody>
          {map.rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td data-label={map.today}>
                {row.ways.map((way) => <div key={way.label} className="dv-cmp-way"><p>{way.label}</p><Tools tools={way.tools} /></div>)}
              </td>
              <td data-self="" data-label={map.selfName}><p>{row.self}</p></td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="dv-cv-note">{map.note}</figcaption>
    </figure>
  );
}
