"use client";

import { ArrowIcon } from "@/components/arrow-icon";

export type DiamondStage = { name: string; outcome?: string; methods?: string[]; current?: boolean };

const HALVES = ["M0 167L300 0V334Z", "M300 0L600 167L300 334Z", "M600 167L900 0V334Z", "M900 0L1200 167L900 334Z"];

// The Double Diamond, still: two outlined diamonds that draw in on reveal. Each stage is one
// column read top to bottom: its name above the diagram, its methods inside its half, its
// outcome under it. Only the stage marked `current` and its `pivot` carry the case colour.
// Nothing in it is a link (owner: nothing to click, so no pointer). Shared by the Devsign body and CaseDiamond.
type DiamondPoint = { label: string; text: string };

export function DoubleDiamond({ stages, pivot, waist, end }: { stages: DiamondStage[]; pivot?: string; waist?: DiamondPoint; end?: DiamondPoint }) {
  const [from, to] = pivot?.split(" → ") ?? [];
  return (
    <figure className="dv-dd reveal">
      {/* Stage names stay above the diagram; what was done sits inside each half,
          and what came of it sits under the same half (owner: one column per stage,
          read top to bottom, nothing appearing later). */}
      <ol className="dv-dd-heads" aria-hidden="true">
        {stages.map((stage, i) => (
          <li key={stage.name} data-current={stage.current || undefined}><b>{String(i + 1).padStart(2, "0")}</b>{stage.name}</li>
        ))}
      </ol>
      <div className="dv-dd-body">
        <svg className="dv-dd-lines" viewBox="0 0 1200 334" fill="none" aria-hidden="true">
          {HALVES.map((d, i) => <path key={d} className="dv-dd-half" d={d} data-current={stages[i]?.current || undefined} />)}
          <path className="dv-dd-line" pathLength={1} d="M1 167L300 1L599 167L300 333Z" />
          <path className="dv-dd-line" pathLength={1} d="M601 167L900 1L1199 167L900 333Z" />
          {waist && <><path className="dv-dd-point-line" d="M600 82V167" /><circle className="dv-dd-point" cx="600" cy="167" r="7" /></>}
          {end && <><path className="dv-dd-point-line" d="M1192 66V167" /><circle className="dv-dd-point" cx="1192" cy="167" r="7" /></>}
        </svg>
        <ol className="dv-dd-stages">
          {stages.map((stage) => (
            <li key={stage.name} data-current={stage.current || undefined}>
              <div className="dv-dd-stage">
                <span className="dv-dd-stage-name">{stage.name}</span>
                <span className="dv-dd-name">
                  <span className="dv-dd-inside">{(stage.methods ?? []).map((m) => <span key={m}>{m}</span>)}</span>
                </span>
                {stage.outcome && <span className="dv-dd-outcome">{stage.outcome}</span>}
                {stage.current && pivot && <span className="dv-dd-pivot">{from}{to && <><ArrowIcon size={14} />{to}</>}</span>}
              </div>
            </li>
          ))}
        </ol>
        {waist && <p className="dv-dd-note" data-at="waist"><b>{waist.label}</b>{waist.text}</p>}
        {end && <p className="dv-dd-note" data-at="end"><b>{end.label}</b>{end.text}</p>}
      </div>
    </figure>
  );
}
