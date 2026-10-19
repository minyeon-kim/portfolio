import type { ReactNode } from "react";

// Visible reminder for missing content. Renders in development only, so a
// gap is obvious while writing but never ships.
export function Todo({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <p className="mb-2 rounded-md border border-dashed border-line px-1 py-0.5 font-mono text-xs text-muted">
      TODO: {children}
    </p>
  );
}
