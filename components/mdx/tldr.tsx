import type { ReactNode } from "react";

// TL;DR box at the top of every case. Content is a three-line list:
// `- **Problem:** ...`, `- **My role:** ...`, `- **Outcome:** ...`
// The home cards read these same lines (lib/cases.ts).
export function TLDR({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="tldr"
      className="mb-6 rounded-md bg-fill p-3 [&_li]:mb-2 [&_li:last-child]:mb-0 [&_strong]:mb-0.5 [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-medium [&_strong]:text-muted [&_ul]:mb-0 [&_ul]:list-none [&_ul]:pl-0"
    >
      <h2 id="tldr" className="mb-2 scroll-mt-4 text-[13px] font-medium text-muted">
        TL;DR
      </h2>
      {children}
    </section>
  );
}
