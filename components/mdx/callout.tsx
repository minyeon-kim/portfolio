import type { ReactNode } from "react";

// Emphasis box for an angle worth pulling out, e.g. label="Security lens".
export function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside
      aria-label={label}
      className="reveal my-4 rounded-md border border-l-2 border-line border-l-accent bg-surface px-3 pt-2 pb-0.5 [&_p]:text-sm"
    >
      <p className="mb-1 font-mono text-xs! text-accent">{label}</p>
      {children}
    </aside>
  );
}
