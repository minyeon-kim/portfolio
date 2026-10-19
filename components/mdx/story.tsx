import type { ReactNode } from "react";

// Vertical timeline for the About story. The line fills and each node lights
// up as you scroll past it (CSS scroll-driven animation, see globals.css).
export function Story({ children }: { children: ReactNode }) {
  return (
    <ol className="relative my-4 pl-4">
      <span aria-hidden="true" className="absolute top-1 bottom-1 left-[5px] w-px bg-line" />
      <span aria-hidden="true" className="story-line absolute top-1 bottom-1 left-[5px] w-px origin-top bg-accent" />
      {children}
    </ol>
  );
}

export function Chapter({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <li className="reveal relative mb-6 last:mb-0">
      <span
        aria-hidden="true"
        className="story-node absolute top-0.5 -left-4 size-1.5 rounded-md border border-line bg-bg"
      />
      <p className="mb-0.5 font-mono text-xs text-muted">{label}</p>
      <h3 className="mb-1 text-lg font-medium">{title}</h3>
      {children}
    </li>
  );
}
