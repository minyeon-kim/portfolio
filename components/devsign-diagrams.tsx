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

type NodeId = "drafts" | "merge" | "rule" | "review" | "reviewDecider" | "decide" | "apply" | "verify";
export type FlowChartData = {
  label: string;
  meet: string[];
  phases: string[];
  lanes: { name: string; job: string[] }[];
  nodes: Record<NodeId, string[]>;
  history: string[];
  // What is handed to the next person, on the three arrows that cross lanes.
  handoffs: { flag: string[]; request: string[]; decision: string[] };
  // The branches, kept as notes on a quiet dashed line.
  notes: { save: string; direct: string; start: string };
};

const NODE_W = 148;
const NODE_H = 64;
const STEP = 170;
const FIRST_COL = 170;
const WIDTH = 1200;
const HEIGHT = 480;
const LANES = [{ y: 48, h: 128 }, { y: 184, h: 128 }, { y: 320, h: 160 }];
const ROW = LANES.map((lane) => lane.y + 32);
// One colour per person, the same ones the personas and participants use.
const LANE_TONES = ["accent", "second", "blue"];
// Which columns each phase covers.
const PHASES = [[0, 1], [2, 2], [3, 3], [4, 5]];

const left = (col: number) => FIRST_COL + STEP * col;
const right = (col: number) => left(col) + NODE_W;
const mid = (col: number) => left(col) + NODE_W / 2;
const middle = (row: number) => ROW[row] + NODE_H / 2;
const top = (row: number) => ROW[row];
const bottom = (row: number) => ROW[row] + NODE_H;

type Kind = "start" | "step" | "ask" | "key";
const NODES: { id: NodeId; col: number; row: number; kind: Kind }[] = [
  { id: "drafts", col: 0, row: 0, kind: "start" },
  { id: "merge", col: 1, row: 0, kind: "step" },
  { id: "rule", col: 2, row: 0, kind: "ask" },
  { id: "review", col: 2, row: 1, kind: "key" },
  { id: "apply", col: 3, row: 1, kind: "step" },
  { id: "verify", col: 4, row: 1, kind: "step" },
  { id: "reviewDecider", col: 2, row: 2, kind: "key" },
  { id: "decide", col: 3, row: 2, kind: "ask" },
];

const GAP = 3;
const across = (row: number, from: number) => `M${right(from) + GAP} ${middle(row)}H${left(from + 1) - GAP}`;
const EDGES = [across(0, 0), across(0, 1), across(1, 3), across(1, 4), across(2, 2)];
const HANDOFFS = [
  `M${mid(2)} ${bottom(0) + GAP}V${top(1) - GAP}`,
  `M${mid(2)} ${bottom(1) + GAP}V${top(2) - GAP}`,
  `M${mid(3)} ${top(2) - GAP}V${bottom(1) + GAP}`,
];
const BRANCHES = [
  `M${right(2) + GAP} ${middle(0)}H${left(5) - GAP}`,
  `M${right(2) + GAP} ${middle(1)}H${left(3) - GAP}`,
  `M${right(1) - 8} ${middle(1)}H${left(2) - GAP}`,
];

function Shape({ kind, x, y }: { kind: Kind; x: number; y: number }) {
  if (kind === "ask") {
    const n = 14;
    return <path className="dv-fc-ask" d={`M${x + n} ${y}H${x + NODE_W - n}L${x + NODE_W} ${y + NODE_H / 2}L${x + NODE_W - n} ${y + NODE_H}H${x + n}L${x} ${y + NODE_H / 2}Z`} />;
  }
  return <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={kind === "start" ? NODE_H / 2 : 12} className={`dv-fc-${kind}`} />;
}

export function FlowChart({ chart }: { chart: FlowChartData }) {
  const { nodes, handoffs, notes } = chart;
  // These read as "name · detail" in the list, not one sentence.
  const QUALIFIED = [nodes.merge, nodes.review, nodes.reviewDecider];
  const lists = [
    { steps: [nodes.drafts, nodes.merge, nodes.rule], out: handoffs.flag, note: [notes.save] },
    { steps: [nodes.review], out: handoffs.request, after: [nodes.apply, nodes.verify, [chart.history[0]]], note: [notes.start, notes.direct] },
    { steps: [nodes.reviewDecider, nodes.decide], out: handoffs.decision },
  ];
  const historyY = LANES[0].y + 16;
  const historyH = LANES[2].y + LANES[2].h - 16 - historyY;
  return (
    <div className="dv-fc dv-gap-40 reveal">
      <div className="dv-scroll dv-fc-scroll">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={chart.label}>
          <defs>
            <marker id="dv-fc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto">
              <path d="M0 0L8 4L0 8Z" className="dv-fc-head" />
            </marker>
            <marker id="dv-fc-arrow-strong" viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto">
              <path d="M0 0L8 4L0 8Z" className="dv-fc-head-strong" />
            </marker>
          </defs>
          {chart.phases.map((phase, i) => (
            <g key={phase}>
              <text x={left(PHASES[i][0])} y={24} className="dv-fc-phase" data-key={i === 1 || undefined}>{phase}</text>
              <path d={`M${left(PHASES[i][0])} 36H${right(PHASES[i][1])}`} className="dv-fc-phaseline" />
            </g>
          ))}
          {LANES.map((lane, i) => <rect key={lane.y} x={0} y={lane.y} width={WIDTH} height={lane.h} rx={16} className="dv-fc-lane" data-tone={LANE_TONES[i]} />)}
          <rect x={left(2) - 10} y={bottom(0) + 10} width={NODE_W + 20} height={LANES[2].y + LANES[2].h - 8 - bottom(0) - 10} rx={16} className="dv-fc-band" />
          {chart.lanes.map((lane, i) => (
            <g key={lane.name}>
              <text x={20} y={ROW[i] + 16} className="dv-fc-lanename" data-tone={LANE_TONES[i]}>{lane.name}</text>
              {lane.job.map((line, l) => <text key={line} x={20} y={ROW[i] + 40 + l * 22} className="dv-fc-job">{line}</text>)}
            </g>
          ))}
          {BRANCHES.map((d) => <path key={d} d={d} className="dv-fc-branchline" markerEnd="url(#dv-fc-arrow)" />)}
          {EDGES.map((d) => <path key={d} d={d} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />)}
          {HANDOFFS.map((d) => <path key={d} d={d} className="dv-fc-handoff" markerEnd="url(#dv-fc-arrow-strong)" />)}
          {NODES.map(({ id, col, row, kind }) => {
            const lines = nodes[id];
            const first = ROW[row] + NODE_H / 2 + 6 - ((lines.length - 1) * 22) / 2;
            return (
              <g key={id}>
                <Shape kind={kind} x={left(col)} y={ROW[row]} />
                {lines.map((line, l) => <text key={line} x={mid(col)} y={first + l * 22} textAnchor="middle" className={`dv-fc-text dv-fc-text-${kind}`}>{line}</text>)}
              </g>
            );
          })}
          <rect x={left(5)} y={historyY} width={NODE_W} height={historyH} rx={12} className="dv-fc-store" />
          {chart.history.map((line, l) => <text key={line} x={mid(5)} y={historyY + historyH / 2 - 16 + l * 22} textAnchor="middle" className={l === 0 ? "dv-fc-text dv-fc-text-store" : "dv-fc-text dv-fc-text-storesub"}>{line}</text>)}
          <path d={`M${right(4) + GAP} ${middle(1)}H${left(5) - GAP}`} className="dv-fc-line" markerEnd="url(#dv-fc-arrow)" />
          <text x={left(3)} y={middle(0) - 10} className="dv-fc-note">{notes.save}</text>
          <text x={left(3)} y={top(1) - 8} className="dv-fc-note">{notes.direct}</text>
          <text x={right(1) - 16} y={middle(1) + 6} textAnchor="end" className="dv-fc-note">{notes.start}</text>
          {handoffs.flag.map((line, l) => <text key={line} x={mid(2) + 12} y={bottom(0) + 28 + l * 20} className="dv-fc-handofftext" data-on-band>{line}</text>)}
          {handoffs.request.map((line, l) => <text key={line} x={mid(2) + 12} y={bottom(1) + 18 + l * 20} className="dv-fc-handofftext" data-on-band>{line}</text>)}
          {handoffs.decision.map((line, l) => <text key={line} x={mid(3) + 12} y={bottom(1) + 18 + l * 20} className="dv-fc-handofftext">{line}</text>)}
          {chart.meet.map((line, l) => <text key={line} x={mid(2)} y={bottom(2) + 26 + l * 20} textAnchor="middle" className="dv-fc-meet">{line}</text>)}
        </svg>
      </div>
      {/* Phones read it as one list per person; screen readers always get this list. */}
      <div className="dv-fc-list">
        {chart.lanes.map((lane, i) => {
          const list = lists[i];
          return (
            <div key={lane.name} data-tone={LANE_TONES[i]}>
              <h4>{lane.name}</h4>
              <p>{lane.job.join(" ")}</p>
              <ol>
                {list.steps.map((step) => <li key={step.join()}>{step.join(QUALIFIED.includes(step) ? " · " : " ")}</li>)}
                <li data-handoff>→ {list.out.join(" ")}</li>
                {list.after?.map((step) => <li key={step.join()}>{step.join(" ")}</li>)}
              </ol>
              {list.note?.map((note) => <p key={note} className="dv-fc-listnote">{note}</p>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
