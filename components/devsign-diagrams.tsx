import Link from "next/link";
import { withBase } from "@/lib/site";

// The information architecture and the user flow, drawn in code so their text is real
// text at reading size, in the page's language and theme. The words live in the case
// MDX (develop.ia.tree, develop.flow.chart); the layout lives here.

// An item is [name, ...children].
type IaColumn = { label?: string; items: string[][] };
type IaGroup = { name: string; main?: boolean; columns: IaColumn[] };
export type IaTreeData = { root: string; groups: IaGroup[]; detailed?: string[] };

// The case page's form: lines only between boxes, details inside them. The main group
// branches into its own boxes; only the items named in `detailed` show their children.
export function IaFocusTree({ tree, more, moreHref }: { tree: IaTreeData; more?: string; moreHref?: string }) {
  const names = (group: IaGroup) => group.columns.flatMap((column) => column.items.length === 1 ? column.items[0].slice(1) : column.items.map(([name]) => name));
  return (
    <div className="dv-iaf dv-gap-40 reveal">
      <p className="dv-ia-root">{tree.root}</p>
      <ul className="dv-iaf-groups">
        {tree.groups.map((group) => group.main ? (
          <li key={group.name} data-main="">
            <h4>{group.name}</h4>
            <div className="dv-iaf-branches">
              {group.columns.map((column) => (
                <div key={column.label}>
                  <p className="dv-iaf-label">{column.label}</p>
                  <ul>
                    {column.items.map(([name, ...children]) => (
                      <li key={name}>
                        <b>{name}</b>
                        {tree.detailed?.includes(name) && <span>{children.join(" · ")}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        ) : (
          <li key={group.name}>
            <div className="dv-iaf-box">
              <h4>{group.name}</h4>
              <ul>{names(group).map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
          </li>
        ))}
      </ul>
      {more && moreHref && <p className="dv-spec-more"><Link className="link" href={moreHref}>{more} →</Link></p>}
    </div>
  );
}

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

type FlowNodeId = "compare" | "pick" | "rule" | "save" | "review" | "decision" | "direct" | "decide" | "apply" | "history";
export type FlowChartData = {
  label: string;
  // The two situations: when each one starts, and a real example for the second.
  a: string;
  b: string;
  example: string;
  yes: string;
  no: string;
  nodes: Record<FlowNodeId, string[]>;
  // Who acts under the second row's steps.
  who: { developer: string; decider: string };
  list: { title: string; items: string[] }[];
  full: { src: string; label: string };
};

const FC_W = 148;
const FC_H = 64;
const FC_STEP = 170;
const FC_WIDTH = 1168;
const FC_HEIGHT = 368;
const ROW_A = 40;
const ROW_B = 184;
const ROW_C = 300;
const fcLeft = (col: number) => FC_STEP * col;
const fcRight = (col: number) => fcLeft(col) + FC_W;
const fcMid = (col: number) => fcLeft(col) + FC_W / 2;
const mid = (row: number) => row + FC_H / 2;

type FcKind = "step" | "ask" | "key" | "store" | "result";
const FC_NODES: { id: FlowNodeId; col: number; row: number; kind: FcKind }[] = [
  { id: "compare", col: 0, row: ROW_A, kind: "step" },
  { id: "pick", col: 1, row: ROW_A, kind: "step" },
  { id: "rule", col: 2, row: ROW_A, kind: "ask" },
  { id: "save", col: 3, row: ROW_A, kind: "result" },
  { id: "review", col: 2, row: ROW_B, kind: "key" },
  { id: "decision", col: 3, row: ROW_B, kind: "ask" },
  { id: "decide", col: 4, row: ROW_B, kind: "key" },
  { id: "apply", col: 5, row: ROW_B, kind: "step" },
  { id: "history", col: 6, row: ROW_B, kind: "store" },
  { id: "direct", col: 3, row: ROW_C, kind: "result" },
];

const across = (row: number, col: number) => `M${fcRight(col) + 3} ${mid(row)}H${fcLeft(col + 1) - 3}`;
const FC_EDGES = [across(ROW_A, 0), across(ROW_A, 1), across(ROW_A, 2), across(ROW_B, 2), across(ROW_B, 5)];
const FC_HANDOFFS = [`M${fcMid(2)} ${ROW_A + FC_H + 3}V${ROW_B - 3}`, across(ROW_B, 3), across(ROW_B, 4)];

function FcLines({ lines, x, y, className }: { lines: string[]; x: number; y: number; className: string }) {
  return <>{lines.map((line, l) => <text key={line} x={x} y={y + l * 22} textAnchor="middle" className={className}>{line}</text>)}</>;
}

// Two situations, each read left to right. The heavy arrows are where the work passes to someone
// else; the one going down joins the first situation to the second.
export function FlowChart({ chart }: { chart: FlowChartData }) {
  const { nodes, who } = chart;
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <svg viewBox={`0 0 ${FC_WIDTH} ${FC_HEIGHT}`} role="img" aria-label={chart.label}>
          <defs>
            <marker id="dv-fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head" /></marker>
            <marker id="dv-fc-arrow-strong" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head-strong" /></marker>
          </defs>
          <text x={0} y={18} className="dv-fc-situation">{chart.a}</text>
          <text x={0} y={mid(ROW_B) - 6} className="dv-fc-situation">{chart.b}</text>
          <text x={0} y={mid(ROW_B) + 18} className="dv-fc-when">{chart.example}</text>
          {FC_EDGES.map((edge) => <path key={edge} d={edge} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />)}
          {FC_HANDOFFS.map((edge) => <path key={edge} d={edge} className="dv-fc-handoff" markerEnd="url(#dv-fc-arrow-strong)" />)}
          <path d={`M${fcMid(3)} ${ROW_B + FC_H + 3}V${ROW_C - 3}`} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />
          {FC_NODES.map(({ id, col, row, kind }) => {
            const x = fcLeft(col);
            const lines = nodes[id];
            return (
              <g key={id}>
                {kind === "ask"
                  ? <path className="dv-fc-ask" d={`M${x + 14} ${row}H${x + FC_W - 14}L${x + FC_W} ${mid(row)}L${x + FC_W - 14} ${row + FC_H}H${x + 14}L${x} ${mid(row)}Z`} />
                  : <rect x={x} y={row} width={FC_W} height={FC_H} rx={12} className={kind === "result" ? "dv-fc-branchnode" : `dv-fc-${kind}`} />}
                <FcLines lines={lines} x={fcMid(col)} y={mid(row) + 6 - ((lines.length - 1) * 22) / 2} className={kind === "store" ? "dv-fc-text dv-fc-text-store" : kind === "result" ? "dv-fc-text dv-fc-text-branch" : "dv-fc-text"} />
              </g>
            );
          })}
          <text x={fcRight(2) + 11} y={ROW_A - 8} textAnchor="middle" className="dv-fc-when">{chart.yes}</text>
          <text x={fcMid(2) + 12} y={ROW_A + FC_H + 44} className="dv-fc-when">{chart.no}</text>
          <text x={fcRight(3) + 11} y={ROW_B - 8} textAnchor="middle" className="dv-fc-when">{chart.yes}</text>
          <text x={fcMid(3) + 12} y={ROW_B + FC_H + 30} className="dv-fc-when">{chart.no}</text>
          <text x={fcMid(2)} y={ROW_B + FC_H + 24} textAnchor="middle" className="dv-fc-who">{who.developer}</text>
          <text x={fcMid(4)} y={ROW_B + FC_H + 24} textAnchor="middle" className="dv-fc-meet">{who.decider}</text>
          <text x={fcMid(5)} y={ROW_B + FC_H + 24} textAnchor="middle" className="dv-fc-who">{who.developer}</text>
        </svg>
      </div>
      {/* Phones read it as a list; screen readers always get this list. */}
      <ol className="dv-fc-list">
        {chart.list.map((group) => (
          <li key={group.title}>
            <h4>{group.title}</h4>
            <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </li>
        ))}
      </ol>
      <a className="link dv-fc-full" href={withBase(chart.full.src)} target="_blank" rel="noreferrer">{chart.full.label}</a>
    </div>
  );
}
