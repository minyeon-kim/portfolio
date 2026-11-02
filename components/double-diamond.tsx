import { ArrowIcon } from "@/components/arrow-icon";

export type DiamondStage = { name: string; outcome?: string; methods?: string[]; current?: boolean };

const HALVES = ["M0 120L300 0V240Z", "M300 0L600 120L300 240Z", "M600 120L900 0V240Z", "M900 0L1200 120L900 240Z"];

// The Double Diamond, kept simple: two outlined diamonds that draw in on reveal,
// the stage names inside them and one outcome under each. Only the stage marked
// `current` and its `pivot` (where the direction changed) carry the case colour.
// Each stage links to its section. Its methods float as a small card on hover or
// keyboard focus and are always shown on touch screens. Shared by the Devsign
// body and CaseDiamond.
export function DoubleDiamond({ stages, pivot }: { stages: DiamondStage[]; pivot?: string }) {
  const [from, to] = pivot?.split(" → ") ?? [];
  return (
    <figure className="dv-dd reveal">
      <div className="dv-dd-body">
        <svg className="dv-dd-lines" viewBox="0 0 1200 240" fill="none" aria-hidden="true">
          {HALVES.map((d, i) => <path key={d} className="dv-dd-half" d={d} data-current={stages[i]?.current || undefined} />)}
          <path className="dv-dd-line" pathLength={1} d="M1 120L300 1L599 120L300 239Z" />
          <path className="dv-dd-line" pathLength={1} d="M601 120L900 1L1199 120L900 239Z" />
        </svg>
        <ol className="dv-dd-stages">
          {stages.map((stage) => (
            <li key={stage.name} data-current={stage.current || undefined}>
              <a href={`#${stage.name.toLowerCase()}`}>
                <span className="dv-dd-name">{stage.name}</span>
                {stage.outcome && <span className="dv-dd-outcome">{stage.outcome}</span>}
                {stage.current && pivot && <span className="dv-dd-pivot">{from}{to && <><ArrowIcon size={14} />{to}</>}</span>}
                {stage.methods && <span className="dv-dd-methods">{stage.methods.map((m) => <span key={m}>{m}</span>)}</span>}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
