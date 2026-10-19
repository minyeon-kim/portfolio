import type { ReactNode } from "react";

// Collapsible rationale under a design decision. Native <details> gives
// keyboard support (Tab to focus, Enter/Space to toggle) with no JS.
export function WhyIChose({
  children,
  label = "Why I chose this",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <details className="reveal group mb-4 rounded-md bg-fill">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2 py-1 font-mono text-xs text-muted transition-colors duration-150 ease-standard hover:text-ink [&::-webkit-details-marker]:hidden">
        {label}
        <span
          aria-hidden="true"
          className="text-sm transition-transform duration-250 ease-standard group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-2 pt-0.5 pb-0.5 [&_p]:text-sm">{children}</div>
    </details>
  );
}
