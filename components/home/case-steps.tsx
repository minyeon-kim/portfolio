"use client";

import type { TocItem } from "@/lib/cases";
import { useActiveSection } from "@/lib/use-active-section";

// Step list in a case section's sticky column. The step whose block is
// crossing the upper part of the screen lights up; clicking jumps to it.
export function CaseSteps({ steps }: { steps: TocItem[] }) {
  const active = useActiveSection(
    steps.map((s) => s.id),
    0.4,
  );

  return (
    <ol className="space-y-0.5 font-mono text-xs">
      {steps.map(({ id, label }, i) => {
        const current = active === id;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-1 rounded-md transition-colors duration-250 ease-standard ${current ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              <span
                aria-hidden="true"
                className={`h-[2px] rounded-full transition-[width,background-color] duration-250 ease-standard ${current ? "w-3 bg-accent" : "w-1 bg-line"}`}
              />
              <span>
                {String(i + 1).padStart(2, "0")} {label}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
