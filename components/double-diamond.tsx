export type DiamondStage = { name: string; methods: string[]; current?: boolean };
export type DiamondLabels = { problem: string; solution: string; coreProblem: string; research: string; design: string };

// The Double Diamond as drawn in the Devsign Figma frame (1440 x 520): four
// half-diamonds of 256 x 400, Problem and Solution at the ends, the core
// problem marked at the waist, Research and Design under each diamond. The
// stage marked `current` is tinted in the case colour; `pivot` is the note
// hung under it (where the direction changed). Shared by the Devsign body and
// CaseDiamond, so every case tells its process the same way.
export function DoubleDiamond({ stages, pivot, labels }: { stages: DiamondStage[]; pivot?: string; labels: DiamondLabels }) {
  const halves = [
    { x: 200, d: "M0 200L256 0V400Z" },
    { x: 464, d: "M0 0L256 200L0 400Z" },
    { x: 720, d: "M0 200L256 0V400Z" },
    { x: 984, d: "M0 0L256 200L0 400Z" },
  ];
  const centers = [373, 547, 888, 1067];
  const current = Math.max(0, stages.findIndex((s) => s.current));
  const callout = centers[current] - 67.5;
  return (
    <div className="dv-scroll reveal">
      <svg className="dv-diamond" viewBox="0 0 1440 520" role="img" aria-label={`Double diamond: ${stages.map((s) => `${s.name} (${s.methods.join(", ")})`).join("; ")}.${pivot ? ` ${pivot}` : ""}`}>
        {halves.map(({ x, d }, i) => (
          <path key={x} d={d} transform={`translate(${x} 30)`} className={stages[i]?.current ? "dv-diamond-current" : `dv-diamond-half dv-diamond-half-${i}`} />
        ))}
        <path d="M199.5 50V410M1240.5 50V410M720.5 170V290" className="dv-diamond-dash" />
        <text x="111" y="238" className="dv-svg-strong" textAnchor="middle" fontSize="20">{labels.problem.toUpperCase()}</text>
        <text x="1331" y="238" className="dv-svg-strong" textAnchor="middle" fontSize="20">{labels.solution.toUpperCase()}</text>
        <text x="720" y="84" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="14">{labels.coreProblem.toUpperCase()}</text>
        <text x="460" y="477" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="18">{labels.research.toUpperCase()}</text>
        <text x="980" y="477" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="18">{labels.design.toUpperCase()}</text>
        {stages.map((stage, i) => (
          <g key={stage.name}>
            <text x={centers[i]} y="200" textAnchor="middle" fontSize="22" className={stage.current ? "dv-svg-accent" : "dv-svg-strong"}>{stage.name.toUpperCase()}</text>
            {stage.methods.map((method, j) => (
              <text key={method} x={centers[i]} y={226 + j * 22.4} textAnchor="middle" fontSize="14" className="dv-svg-muted">{method}</text>
            ))}
          </g>
        ))}
        {pivot && (
          <>
            <path d={`M${callout} 312V380`} className="dv-diamond-callout" />
            <circle cx={callout} cy="312" r="3" className="dv-svg-dot" />
            <text x={callout} y="402" textAnchor="middle" fontSize="14" className="dv-svg-accent dv-svg-regular">{pivot}</text>
          </>
        )}
      </svg>
    </div>
  );
}
