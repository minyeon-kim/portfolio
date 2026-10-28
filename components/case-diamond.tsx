"use client";

import { DoubleDiamond } from "@/components/double-diamond";
import { useStrings } from "@/lib/use-locale";

type DiamondPhase = { label: string; title: string; methods?: string[]; output?: string; body?: string; current?: boolean };

// The process figure for MDX cases: the Devsign Double Diamond (stages and
// their methods inside the shape), then one note per phase with what it found
// and what it handed on. `current` marks the phase where the direction
// changed; `pivot` is the short note hung under it.
export function CaseDiamond({ items, pivot }: { items: DiamondPhase[]; pivot?: string }) {
  const t = useStrings();
  return (
    <figure className="case-diamond reveal">
      <DoubleDiamond
        stages={items.map((item) => ({ name: item.label, methods: item.methods ?? [], current: item.current }))}
        pivot={pivot}
        labels={{ problem: t.problem, solution: t.solution, coreProblem: t.coreProblem, research: t.research, design: t.design }}
      />
      <ol className="case-diamond-notes">
        {items.map((item) => (
          <li key={item.label} data-current={item.current || undefined}>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            {item.body && <p>{item.body}</p>}
            {item.output && <p className="case-diamond-output"><span aria-hidden="true">→</span> {item.output}</p>}
          </li>
        ))}
      </ol>
    </figure>
  );
}
