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

type FlowNodeId = "merge" | "rule" | "review" | "decision" | "reviewDecider" | "approve" | "apply" | "history";
export type FlowChartData = {
  label: string;
  // Who acts: designer, developer, decision-maker, developer, record.
  groups: string[];
  nodes: Record<FlowNodeId, string[]>;
  // What is handed to the next person.
  links: { flag: string[]; request: string[]; decision: string[] };
  // The three short branches under the row.
  branches: { save: { when: string; node: string[] }; direct: { when: string; node: string[] }; start: { node: string[] } };
  meet: string;
  full: { src: string; label: string };
};

const FC_W = 124;
const FC_H = 64;
const FC_STEP = 152;
const FC_WIDTH = 1192;
const FC_HEIGHT = 288;
const FC_ROW = 92;
const FC_BELOW = 212;
const fcLeft = (col: number) => FC_STEP * col;
const fcRight = (col: number) => fcLeft(col) + FC_W;
const fcMid = (col: number) => fcLeft(col) + FC_W / 2;
const FC_GROUPS = [[0, 1], [2, 3], [4, 5], [6, 6], [7, 7]];

type FcKind = "step" | "ask" | "key" | "store";
const FC_NODES: { id: FlowNodeId; kind: FcKind }[] = [
  { id: "merge", kind: "step" },
  { id: "rule", kind: "ask" },
  { id: "review", kind: "key" },
  { id: "decision", kind: "ask" },
  { id: "reviewDecider", kind: "key" },
  { id: "approve", kind: "ask" },
  { id: "apply", kind: "step" },
  { id: "history", kind: "store" },
];

function FcLines({ lines, x, y, className }: { lines: string[]; x: number; y: number; className: string }) {
  return <>{lines.map((line, l) => <text key={line} x={x} y={y + l * 22} textAnchor="middle" className={className}>{line}</text>)}</>;
}

// One row, read left to right. Only the three decisions branch, each to one short result, and the
// person changing above the row is the handoff (the heavy arrows, which say what is handed over).
export function FlowChart({ chart }: { chart: FlowChartData }) {
  const { nodes, links, branches } = chart;
  const middle = FC_ROW + FC_H / 2;
  const heavy = new Set([1, 3, 5]);
  const below = [
    { col: 1, node: branches.save.node },
    { col: 2, node: branches.start.node },
    { col: 3, node: branches.direct.node },
  ];
  const list = [
    { who: chart.groups[0], items: [nodes.merge.join(" · "), nodes.rule.join(" "), `${branches.save.when}: ${branches.save.node.join(" ")}`] },
    { who: chart.groups[1], items: [`${links.flag.join(" ")}`, nodes.review.join(" · "), `${branches.start.node.join(" ")}`, nodes.decision.join(" "), `${branches.direct.when}: ${branches.direct.node.join(" ")}`] },
    { who: chart.groups[2], items: [`${links.request.join(" ")}`, nodes.reviewDecider.join(" · "), nodes.approve.join(" ")] },
    { who: chart.groups[3], items: [`${links.decision.join(" ")}`, nodes.apply.join(" ")] },
    { who: chart.groups[4], items: [nodes.history.join(": ")] },
  ];
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <svg viewBox={`0 0 ${FC_WIDTH} ${FC_HEIGHT}`} role="img" aria-label={chart.label}>
          <defs>
            <marker id="dv-fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head" /></marker>
            <marker id="dv-fc-arrow-strong" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0L8 4L0 8Z" className="dv-fc-head-strong" /></marker>
          </defs>
          {chart.groups.map((group, i) => (
            <g key={`${group}-${i}`}>
              <text x={fcLeft(FC_GROUPS[i][0])} y={18} className="dv-fc-group">{group}</text>
              <path d={`M${fcLeft(FC_GROUPS[i][0])} 30H${fcRight(FC_GROUPS[i][1])}`} className="dv-fc-groupline" />
            </g>
          ))}
          {FC_NODES.slice(0, -1).map((_, col) => (
            <path key={col} d={`M${fcRight(col) + 3} ${middle}H${fcLeft(col + 1) - 3}`} className={heavy.has(col) ? "dv-fc-handoff" : "dv-fc-line"} markerEnd={heavy.has(col) ? "url(#dv-fc-arrow-strong)" : "url(#dv-fc-arrow)"} />
          ))}
          {FC_NODES.map(({ id, kind }, col) => {
            const x = fcLeft(col);
            const lines = nodes[id];
            return (
              <g key={id}>
                {kind === "ask"
                  ? <path className="dv-fc-ask" d={`M${x + 14} ${FC_ROW}H${x + FC_W - 14}L${x + FC_W} ${middle}L${x + FC_W - 14} ${FC_ROW + FC_H}H${x + 14}L${x} ${middle}Z`} />
                  : <rect x={x} y={FC_ROW} width={FC_W} height={FC_H} rx={12} className={`dv-fc-${kind}`} />}
                <FcLines lines={lines} x={fcMid(col)} y={middle + 6 - ((lines.length - 1) * 22) / 2} className={kind === "store" ? "dv-fc-text dv-fc-text-store" : "dv-fc-text"} />
              </g>
            );
          })}
          <FcLines lines={links.flag} x={fcRight(1) + 14} y={FC_ROW - 34} className="dv-fc-link" />
          <FcLines lines={links.request} x={fcRight(3) + 14} y={FC_ROW - 34} className="dv-fc-link" />
          <FcLines lines={links.decision} x={fcRight(5) + 14} y={FC_ROW - 34} className="dv-fc-link" />
          {below.map(({ col, node }) => (
            <g key={col}>
              <rect x={fcLeft(col)} y={FC_BELOW} width={FC_W} height={FC_H} rx={col === 2 ? FC_H / 2 : 12} className="dv-fc-branchnode" />
              <FcLines lines={node} x={fcMid(col)} y={FC_BELOW + FC_H / 2 + 6 - 11} className="dv-fc-text dv-fc-text-branch" />
            </g>
          ))}
          <path d={`M${fcMid(1)} ${FC_ROW + FC_H + 3}V${FC_BELOW - 3}`} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />
          <path d={`M${fcMid(3)} ${FC_ROW + FC_H + 3}V${FC_BELOW - 3}`} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />
          <path d={`M${fcMid(2)} ${FC_BELOW - 3}V${FC_ROW + FC_H + 3}`} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />
          <text x={fcMid(1) + 10} y={FC_ROW + FC_H + 34} className="dv-fc-when">{branches.save.when}</text>
          <text x={fcMid(3) + 10} y={FC_ROW + FC_H + 34} className="dv-fc-when">{branches.direct.when}</text>
          <text x={fcMid(4)} y={FC_ROW + FC_H + 28} textAnchor="middle" className="dv-fc-meet">{chart.meet}</text>
        </svg>
      </div>
      {/* Phones read it as a list; screen readers always get this list. */}
      <ol className="dv-fc-list">
        {list.map((group, i) => (
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
