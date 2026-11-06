import Link from "next/link";
import { withBase } from "@/lib/site";
import { FlowPlay } from "./flow-play";

// The information architecture and the user flow, drawn in code so their text is real
// text at reading size, in the page's language and theme. The words live in the case
// MDX (develop.ia.tree, develop.flow.chart); the layout lives here.

// An item is [name, ...children].
type IaColumn = { label?: string; items: string[][] };
type IaGroup = { name: string; main?: boolean; columns: IaColumn[] };
export type IaTreeData = { root: string; groups: IaGroup[] };

// The case page's form: only the main group, as on the original board: the group, its
// items, their children. The whole product is on the spec page.
export function IaFocusTree({ tree, more, moreHref }: { tree: IaTreeData; more?: string; moreHref?: string }) {
  const main = tree.groups.find((group) => group.main);
  if (!main) return null;
  return (
    <div className="dv-iaf dv-gap-40 reveal">
      <h4>{main.name}</h4>
      <ul className="dv-iaf-items">
        {main.columns.flatMap((column) => column.items).map(([name, ...children]) => (
          <li key={name}>
            <b>{name}</b>
            {children.length > 0 && <ul className="dv-iaf-leaves">{children.map((child) => <li key={child}><span>{child}</span></li>)}</ul>}
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

const FC_PAD = 32;
const FC_W = 195;
const FC_H = 72;
const FC_STEP = 235;
const FC_WIDTH = 1200;
const FC_HEIGHT = 548;
const FC_BOX_A = 192;
const FC_BOX_B = 216;
const ROW_A = 72;
const ROW_B = 316;
const ROW_C = 444;
const fcLeft = (col: number) => FC_PAD + FC_STEP * col;
const fcRight = (col: number) => fcLeft(col) + FC_W;
const fcMid = (col: number) => fcLeft(col) + FC_W / 2;
const mid = (row: number) => row + FC_H / 2;

type FcKind = "step" | "ask" | "key" | "store" | "result";
const FC_NODES: { id: FlowNodeId; col: number; row: number; kind: FcKind }[] = [
  { id: "compare", col: 0, row: ROW_A, kind: "step" },
  { id: "pick", col: 1, row: ROW_A, kind: "step" },
  { id: "rule", col: 2, row: ROW_A, kind: "ask" },
  { id: "save", col: 3, row: ROW_A, kind: "result" },
  { id: "review", col: 0, row: ROW_B, kind: "key" },
  { id: "decision", col: 1, row: ROW_B, kind: "ask" },
  { id: "decide", col: 2, row: ROW_B, kind: "key" },
  { id: "apply", col: 3, row: ROW_B, kind: "step" },
  { id: "history", col: 4, row: ROW_B, kind: "store" },
  { id: "direct", col: 1, row: ROW_C, kind: "result" },
];

// The order the flow appears in (FlowPlay): A step by step, its "no" down into B, then B.
const FC_ORDER: Record<FlowNodeId, number> = { compare: 1, pick: 3, rule: 5, save: 7, review: 12, decision: 14, decide: 16, direct: 16, apply: 18, history: 20 };
const FC_EDGE_ORDER = [2, 4, 6, 13, 19];
const FC_HANDOFF_ORDER = [8, 15, 17];
const seq = (i: number) => ({ "data-seq": "", style: { "--i": i } as React.CSSProperties });

const across = (row: number, col: number) => `M${fcRight(col) + 3} ${mid(row)}H${fcLeft(col + 1) - 3}`;
const FC_EDGES = [across(ROW_A, 0), across(ROW_A, 1), across(ROW_A, 2), across(ROW_B, 0), across(ROW_B, 3)];
// A's "no" leaves its box, runs down the left margin of B's and enters B's first step.
const FC_HANDOFFS = [`M${fcMid(2)} ${ROW_A + FC_H + 3}V${(FC_BOX_A + FC_BOX_B) / 2}H14V${mid(ROW_B)}H${fcLeft(0) - 3}`, across(ROW_B, 1), across(ROW_B, 2)];

function FcLines({ lines, x, y, className }: { lines: string[]; x: number; y: number; className: string }) {
  return <>{lines.map((line, l) => <text key={line} x={x} y={y + l * 22} textAnchor="middle" className={className}>{line}</text>)}</>;
}

// Two situations, each in its own box and read left to right, appearing in that order. The heavy arrows are where the work passes to someone
// else; the one going down joins the first situation to the second.
export function FlowChart({ chart }: { chart: FlowChartData }) {
  const { nodes, who } = chart;
  return (
    <FlowPlay className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <svg viewBox={`0 0 ${FC_WIDTH} ${FC_HEIGHT}`} role="img" aria-label={chart.label}>
          <defs>
            <marker id="dv-fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head" /></marker>
            <marker id="dv-fc-arrow-strong" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head-strong" /></marker>
          </defs>
          <rect x={0} y={0} width={FC_WIDTH} height={FC_BOX_A} rx={16} className="dv-fc-box" />
          <rect x={0} y={FC_BOX_B} width={FC_WIDTH} height={FC_HEIGHT - FC_BOX_B} rx={16} className="dv-fc-box" />
          <text x={FC_PAD} y={46} className="dv-fc-situation" {...seq(0)}>{chart.a}</text>
          <text x={FC_PAD} y={FC_BOX_B + 46} className="dv-fc-situation" {...seq(10)}>{chart.b}</text>
          <text x={FC_PAD} y={FC_BOX_B + 74} className="dv-fc-when" {...seq(10)}>{chart.example}</text>
          {FC_EDGES.map((edge, i) => <path key={edge} d={edge} pathLength={1} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" {...seq(FC_EDGE_ORDER[i])} />)}
          {FC_HANDOFFS.map((edge, i) => <path key={edge} d={edge} pathLength={1} className="dv-fc-handoff" markerEnd="url(#dv-fc-arrow-strong)" data-long={i === 0 || undefined} {...seq(FC_HANDOFF_ORDER[i])} />)}
          <path d={`M${fcMid(1)} ${ROW_B + FC_H + 3}V${ROW_C - 3}`} pathLength={1} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" {...seq(15)} />
          {FC_NODES.map(({ id, col, row, kind }) => {
            const x = fcLeft(col);
            const lines = nodes[id];
            return (
              <g key={id} {...seq(FC_ORDER[id])}>
                {kind === "ask"
                  ? <path className="dv-fc-ask" d={`M${x + 14} ${row}H${x + FC_W - 14}L${x + FC_W} ${mid(row)}L${x + FC_W - 14} ${row + FC_H}H${x + 14}L${x} ${mid(row)}Z`} />
                  : <rect x={x} y={row} width={FC_W} height={FC_H} rx={12} className={kind === "result" ? "dv-fc-branchnode" : `dv-fc-${kind}`} />}
                <FcLines lines={lines} x={fcMid(col)} y={mid(row) + 6 - ((lines.length - 1) * 22) / 2} className={kind === "store" ? "dv-fc-text dv-fc-text-store" : kind === "result" ? "dv-fc-text dv-fc-text-branch" : "dv-fc-text"} />
              </g>
            );
          })}
          <text x={fcRight(2) + 20} y={mid(ROW_A) - 12} textAnchor="middle" className="dv-fc-when" {...seq(6)}>{chart.yes}</text>
          <text x={fcMid(2) + 12} y={ROW_A + FC_H + 30} className="dv-fc-when" {...seq(8)}>{chart.no}</text>
          <text x={fcRight(1) + 20} y={mid(ROW_B) - 12} textAnchor="middle" className="dv-fc-when" {...seq(15)}>{chart.yes}</text>
          <text x={fcMid(1) + 12} y={ROW_B + FC_H + 34} className="dv-fc-when" {...seq(15)}>{chart.no}</text>
          <text x={fcMid(0)} y={ROW_B + FC_H + 26} textAnchor="middle" className="dv-fc-who" {...seq(12)}>{who.developer}</text>
          <text x={fcMid(2)} y={ROW_B + FC_H + 26} textAnchor="middle" className="dv-fc-meet" {...seq(16)}>{who.decider}</text>
          <text x={fcMid(3)} y={ROW_B + FC_H + 26} textAnchor="middle" className="dv-fc-who" {...seq(18)}>{who.developer}</text>
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
    </FlowPlay>
  );
}
