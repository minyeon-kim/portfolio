"use client";

import { Children, type ReactNode } from "react";
import { setUi, useUi } from "@/lib/ui-store";

// Below the stage: the selected case's full content, so scrolling down reads
// straight into it. Only the selected case is mounted (no duplicate heading
// ids); the others arrive with the page and swap in instantly.
export function CasePanels({ children }: { children: ReactNode }) {
  const active = useUi((s) => s.activeCase);
  const panels = Children.toArray(children);
  return (
    <div id="case" key={active} className="scroll-mt-4 md:scroll-mt-1">
      {panels[active]}
    </div>
  );
}

// End of a case on the landing page: switch to the next one and glide back
// up to its cover.
export function NextCaseButton({ index, name }: { index: number; name: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        setUi({ activeCase: index });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group press block w-full rounded-md bg-fill p-3 text-left transition-colors duration-150 ease-standard hover:bg-fill-strong"
    >
      <span className="mb-1 block font-mono text-xs text-muted">Next case</span>
      <span className="flex items-baseline gap-1 text-lg">
        {name}
        <span aria-hidden="true" className="transition-transform duration-250 ease-standard group-hover:-translate-y-0.5">
          ↑
        </span>
      </span>
    </button>
  );
}
