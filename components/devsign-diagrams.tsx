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
                        {name}
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

type NodeId = "drafts" | "compare" | "merge" | "preview" | "rule" | "save" | "flag" | "differs" | "points" | "review" | "decision" | "fix" | "request" | "apply" | "verify" | "resolved" | "history" | "inbox" | "reviewDecider" | "approve" | "decide";
export type FlowChartData = {
  label: string;
  meet: string[];
  yes: string;
  no: string;
  sent: string;
  lanes: { name: string; job: string[] }[];
  nodes: Record<NodeId, string[]>;
};

const NODE_W = 128;
const NODE_H = 60;
const LANE_PAD = 20;
const STEP = 148;
const WIDTH = 1200;
const HEIGHT = 612;
const LANES = [{ y: 0, h: 244 }, { y: 256, h: 192 }, { y: 460, h: 152 }];
const ROW = { a: 72, b: 164, c: 276, d: 368, e: 488 };

const left = (col: number) => LANE_PAD + STEP * col;
const right = (col: number) => left(col) + NODE_W;
const mid = (col: number) => left(col) + NODE_W / 2;
const middle = (row: number) => row + NODE_H / 2;
const bottom = (row: number) => row + NODE_H;

type Kind = "start" | "step" | "ask" | "key" | "end" | "store";
const NODES: { id: NodeId; col: number; row: number; kind: Kind }[] = [
  { id: "drafts", col: 0, row: ROW.a, kind: "start" },
  { id: "compare", col: 1, row: ROW.a, kind: "step" },
  { id: "merge", col: 2, row: ROW.a, kind: "step" },
  { id: "preview", col: 3, row: ROW.a, kind: "step" },
  { id: "rule", col: 4, row: ROW.a, kind: "ask" },
  { id: "save", col: 5, row: ROW.a, kind: "step" },
  { id: "history", col: 7, row: ROW.a, kind: "store" },
  { id: "flag", col: 4, row: ROW.b, kind: "step" },
  { id: "fix", col: 4, row: ROW.c, kind: "step" },
  { id: "differs", col: 0, row: ROW.d, kind: "start" },
  { id: "points", col: 1, row: ROW.d, kind: "step" },
  { id: "review", col: 2, row: ROW.d, kind: "key" },
  { id: "decision", col: 3, row: ROW.d, kind: "ask" },
  { id: "request", col: 4, row: ROW.d, kind: "step" },
  { id: "apply", col: 5, row: ROW.d, kind: "step" },
  { id: "verify", col: 6, row: ROW.d, kind: "step" },
  { id: "resolved", col: 7, row: ROW.d, kind: "end" },
  { id: "inbox", col: 1, row: ROW.e, kind: "start" },
  { id: "reviewDecider", col: 2, row: ROW.e, kind: "key" },
  { id: "approve", col: 3, row: ROW.e, kind: "ask" },
  { id: "decide", col: 4, row: ROW.e, kind: "step" },
];

// Straight arrows between neighbours in a row, then the turns. No line crosses a node.
const GAP = 3;
const across = (row: number, from: number, to = from + 1) => `M${right(from) + GAP} ${middle(row)}H${left(to) - GAP}`;
const R = 10;
const EDGES = [
  ...[0, 1, 2, 3].map((col) => across(ROW.a, col)),
  across(ROW.a, 5, 7),
  ...[0, 1, 2, 3].map((col) => across(ROW.d, col)),
  ...[5, 6].map((col) => across(ROW.d, col)),
  ...[1, 2, 3].map((col) => across(ROW.e, col)),
  // A rule is broken: flag it, and it lands on the change review.
  `M${mid(4)} ${bottom(ROW.a) + GAP}V${ROW.b - GAP}`,
  `M${left(4) - GAP} ${middle(ROW.b)}H${mid(2) + R}Q${mid(2)} ${middle(ROW.b)} ${mid(2)} ${middle(ROW.b) + R}V${ROW.d - GAP}`,
  // Not a design decision: the developer fixes it and checks it on screen.
  `M${mid(3)} ${ROW.d - GAP}V${middle(ROW.c) + R}Q${mid(3)} ${middle(ROW.c)} ${mid(3) + R} ${middle(ROW.c)}H${left(4) - GAP}`,
  `M${right(4) + GAP} ${middle(ROW.c)}H${mid(6) - R}Q${mid(6)} ${middle(ROW.c)} ${mid(6)} ${middle(ROW.c) + R}V${ROW.d - GAP}`,
  // A design decision: the request goes back to the decider, on the same screen.
  `M${mid(4)} ${bottom(ROW.d) + GAP}V${bottom(ROW.d) + 10}H${mid(1) + R}Q${mid(1)} ${bottom(ROW.d) + 10} ${mid(1)} ${bottom(ROW.d) + 10 + R}V${ROW.e - GAP}`,
  // The decision returns to the developer.
  `M${right(4) + GAP} ${middle(ROW.e)}H${mid(5) - R}Q${mid(5)} ${middle(ROW.e)} ${mid(5)} ${middle(ROW.e) - R}V${bottom(ROW.d) + GAP}`,
  // Every path ends in History.
  `M${mid(7)} ${ROW.d - GAP}V${bottom(ROW.a) + GAP}`,
];

// In the phone list these nodes read as "name · detail", not one sentence.
const QUALIFIED: NodeId[] = ["merge", "review", "reviewDecider", "request"];

const BAND = { x: left(2) - 10, y: middle(ROW.b) - 16, w: NODE_W + 20 };

function Shape({ kind, x, y }: { kind: Kind; x: number; y: number }) {
  if (kind === "ask") {
    const n = 14;
    return <path className="dv-fc-ask" d={`M${x + n} ${y}H${x + NODE_W - n}L${x + NODE_W} ${y + NODE_H / 2}L${x + NODE_W - n} ${y + NODE_H}H${x + n}L${x} ${y + NODE_H / 2}Z`} />;
  }
  return <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={kind === "start" || kind === "end" ? NODE_H / 2 : 12} className={`dv-fc-${kind}`} />;
}

export function FlowChart({ chart }: { chart: FlowChartData }) {
  const groups: NodeId[][] = [
    ["drafts", "compare", "merge", "preview", "rule", "save", "flag"],
    ["differs", "points", "review", "decision", "fix", "request", "apply", "verify", "resolved", "history"],
    ["inbox", "reviewDecider", "approve", "decide"],
  ];
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={chart.label}>
          <defs>
            <marker id="dv-fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto">
              <path d="M0 0L8 4L0 8Z" className="dv-fc-head" />
            </marker>
          </defs>
          {LANES.map((lane) => <rect key={lane.y} x={0} y={lane.y} width={WIDTH} height={lane.h} rx={16} className="dv-fc-lane" />)}
          <rect x={BAND.x} y={BAND.y} width={BAND.w} height={HEIGHT - 8 - BAND.y} rx={16} className="dv-fc-band" />
          {chart.lanes.map((lane, i) => (
            <g key={lane.name}>
              <text x={LANE_PAD} y={LANES[i].y + 32} className="dv-fc-lanename">{lane.name}</text>
              {lane.job.map((line, l) => <text key={line} x={LANE_PAD} y={LANES[i].y + 56 + l * 22} className="dv-fc-job">{line}</text>)}
            </g>
          ))}
          {EDGES.map((d) => <path key={d} d={d} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />)}
          {NODES.map(({ id, col, row, kind }) => {
            const lines = chart.nodes[id];
            const first = row + NODE_H / 2 + 6 - ((lines.length - 1) * 22) / 2;
            return (
              <g key={id}>
                <Shape kind={kind} x={left(col)} y={row} />
                {lines.map((line, l) => <text key={line} x={mid(col)} y={first + l * 22} textAnchor="middle" className={`dv-fc-text dv-fc-text-${kind}`}>{line}</text>)}
              </g>
            );
          })}
          <text x={left(5)} y={ROW.a - 8} className="dv-fc-branch">{chart.no}</text>
          <text x={mid(4) + 8} y={ROW.b - 10} className="dv-fc-branch">{chart.yes}</text>
          <text x={mid(3) + 10} y={middle(ROW.c) - 8} className="dv-fc-branch">{chart.no}</text>
          <text x={left(4)} y={ROW.d - 8} className="dv-fc-branch">{chart.yes}</text>
          <text x={mid(5) + 10} y={middle(ROW.e) - 2} className="dv-fc-branch">{chart.sent}</text>
          {chart.meet.map((line, l) => <text key={line} x={mid(2)} y={bottom(ROW.e) + 24 + l * 20} textAnchor="middle" className="dv-fc-meet">{line}</text>)}
        </svg>
      </div>
      {/* Phones read it as one list per person; screen readers always get this list. */}
      <div className="dv-fc-list">
        {chart.lanes.map((lane, i) => (
          <div key={lane.name}>
            <h4>{lane.name}</h4>
            <p>{lane.job.join(" ")}</p>
            <ol>
              {groups[i].map((id) => <li key={id} data-key={id === "review" || id === "reviewDecider" || undefined}>{chart.nodes[id].join(QUALIFIED.includes(id) ? " · " : " ")}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
