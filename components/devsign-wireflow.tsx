// The product flow as a wireflow: low-fidelity screens of the real prototype, a dot
// on the element you press and a line to the screen it opens. The workspace is the
// hub: one path combines drafts and returns to it, the other decides a change and
// ends in History.

type Node = { title: string; action: string[] };

const W = 252;
const H = 158;
const COLS = [0, 316, 632, 948];
const ROWS = [72, 366];

function R({ x, y, w, h, r = 2, on }: { x: number; y: number; w: number; h: number; r?: number; on?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} className={on ? "dv-wf-on" : "dv-wf-b"} />;
}

function Frame({ hub, panel, children }: { hub?: boolean; panel?: number; children: React.ReactNode }) {
  return (
    <>
      <rect width={W} height={H} rx={10} className={hub ? "dv-wf-frame dv-wf-hub" : "dv-wf-frame"} />
      <path d={`M0 16H${W}M16 16V${H}`} className="dv-wf-rule" />
      {[28, 42, 56].map((y) => <circle key={y} cx={8} cy={y} r={2.5} className="dv-wf-b" />)}
      {panel && <path d={`M${panel} 16V${H}`} className="dv-wf-rule" />}
      {children}
    </>
  );
}

function Board({ width = 5 }: { width?: number }) {
  return (
    <>
      {[34, 94].flatMap((y) => Array.from({ length: width }, (_, i) => <R key={`${y}-${i}`} x={26 + i * 44} y={y} w={36} h={52} />))}
    </>
  );
}

function Phone({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={5} className="dv-wf-frame" />
      <R x={x + 6} y={y + 8} w={w * 0.5} h={5} />
      <R x={x + 6} y={y + 20} w={w - 12} h={h * 0.28} />
      <R x={x + 6} y={y + h - 18} w={w - 12} h={10} on />
    </>
  );
}

const SCREENS = [
  <Frame key="1" hub>
    <R x={166} y={5} w={30} h={7} r={3.5} />
    <R x={204} y={5} w={36} h={7} r={3.5} on />
    <Board />
  </Frame>,
  <Frame key="2" panel={156}>
    <Board width={3} />
    <R x={166} y={26} w={76} h={8} />
    <R x={166} y={46} w={76} h={22} r={4} on />
    <R x={166} y={76} w={76} h={22} r={4} />
  </Frame>,
  <Frame key="3" panel={156}>
    <Phone x={62} y={26} w={56} h={124} />
    <R x={166} y={24} w={76} h={8} r={4} />
    {[38, 66, 94].map((y) => <R key={y} x={166} y={y} w={76} h={22} r={3} />)}
    <R x={196} y={134} w={48} h={15} r={7} on />
  </Frame>,
  <Frame key="4" panel={156}>
    <Phone x={62} y={26} w={56} h={124} />
    <R x={166} y={24} w={76} h={8} r={4} />
    <rect x={160} y={66} width={86} height={86} rx={6} className="dv-wf-frame" />
    {[76, 90].map((y) => <R key={y} x={168} y={y} w={40} h={7} />)}
    <R x={168} y={104} w={70} h={16} r={3} />
    <R x={168} y={130} w={70} h={14} r={7} on />
  </Frame>,
  <Frame key="5">
    <Phone x={72} y={24} w={108} h={134} />
    <circle cx={126} cy={124} r={5} className="dv-wf-alert" />
  </Frame>,
  <Frame key="6" panel={156}>
    <Phone x={62} y={26} w={56} h={124} />
    <R x={166} y={24} w={60} h={8} />
    {[46, 64].map((y) => <R key={y} x={166} y={y} w={76} h={7} />)}
    <R x={166} y={82} w={76} h={36} r={4} on />
    <R x={166} y={126} w={76} h={7} />
  </Frame>,
  <Frame key="7" panel={156}>
    <Phone x={62} y={26} w={56} h={124} />
    <R x={166} y={24} w={60} h={8} />
    {[42, 58, 74].map((y, i) => <R key={y} x={166} y={y} w={76} h={11} r={3} on={i === 1} />)}
    <R x={166} y={96} w={76} h={24} r={3} />
    <R x={190} y={132} w={54} h={15} r={7} on />
  </Frame>,
  <Frame key="8" panel={90}>
    <R x={24} y={36} w={58} h={18} r={4} on />
    {[62, 86, 110].map((y) => <R key={y} x={24} y={y} w={58} h={14} r={3} />)}
    <Phone x={140} y={24} w={62} h={126} />
  </Frame>,
];

const at = (i: number) => ({ x: COLS[i % 4], y: ROWS[i < 4 ? 0 : 1] });

// Each edge starts on the element you press, in page coordinates. The long way back
// runs behind the screens so it doesn't cross the one it leaves.
const EDGES: { from: number[]; d: string; behind?: boolean }[] = [
  { from: [222, 72 + 8], d: `M222 ${72 + 8}H316` },
  { from: [316 + 236, 72 + 57], d: `M${316 + 236} ${72 + 57}H632` },
  { from: [632 + 236, 72 + 141], d: `M${632 + 236} ${72 + 141}H948` },
  { from: [948 + 203, 72 + 137], d: `M${948 + 203} ${72 + 137}V16H192V72`, behind: true },
  { from: [224, 72 + 108], d: `M224 ${72 + 108}V366` },
  { from: [126, 366 + 124], d: `M126 ${366 + 124}H316` },
  { from: [316 + 236, 366 + 100], d: `M${316 + 236} ${366 + 100}H632` },
  { from: [632 + 236, 366 + 139], d: `M${632 + 236} ${366 + 139}H916V${366 + 45}H948` },
];

export function Wireflow({ nodes, label }: { nodes: Node[]; label: string }) {
  return (
    <div className="dv-scroll dv-wf dv-gap-40 reveal">
      <svg viewBox="-1 0 1202 592" role="img" aria-label={label}>
        <defs>
          <marker id="dv-wf-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0L8 4L0 8Z" className="dv-wf-head" />
          </marker>
        </defs>
        {EDGES.filter((edge) => edge.behind).map((edge) => <path key={edge.d} d={edge.d} className="dv-wf-line" markerEnd="url(#dv-wf-arrow)" />)}
        {nodes.map((node, i) => {
          const { x, y } = at(i);
          return (
            <g key={node.title} transform={`translate(${x} ${y})`}>
              <circle cx={12} cy={-22} r={12} className="dv-wf-num" />
              <text x={12} y={-17} textAnchor="middle" className="dv-wf-numtext">{i + 1}</text>
              <text x={32} y={-16} className="dv-wf-title">{node.title}</text>
              {SCREENS[i]}
              {node.action.map((line, l) => <text key={line} x={0} y={H + 28 + l * 24} className="dv-wf-text">{line}</text>)}
            </g>
          );
        })}
        {EDGES.map((edge) => (
          <g key={edge.d}>
            {!edge.behind && <path d={edge.d} className="dv-wf-line" markerEnd="url(#dv-wf-arrow)" />}
            <circle cx={edge.from[0]} cy={edge.from[1]} r={4} className="dv-wf-dot" />
          </g>
        ))}
      </svg>
      <ol className="sr-only">
        {nodes.map((node) => <li key={node.title}>{node.title}: {node.action.join(" ")}</li>)}
      </ol>
    </div>
  );
}
