"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "failed";

// Copy-to-clipboard with a small confirmation: the icon swaps to a check,
// the label changes, and screen readers hear "Copied". Resets after 2s.
export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  const text = { idle: label, copied: "Copied", failed: "Failed" }[state];

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={text}
      data-state={state}
      className={`group press inline-flex h-4 items-center gap-1 rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong data-[state=copied]:text-accent ${className}`}
    >
      <span aria-hidden="true" className="relative size-2">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute inset-0 size-2 transition-[opacity,scale] duration-250 ease-standard group-data-[state=copied]:scale-50 group-data-[state=copied]:opacity-0"
        >
          <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute inset-0 size-2 scale-50 opacity-0 transition-[opacity,scale] duration-250 ease-standard group-data-[state=copied]:scale-100 group-data-[state=copied]:opacity-100"
        >
          <path d="m3 8.5 3 3 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {/* Every label is stacked in one cell so the button never changes width. */}
      <span className="grid">
        {[label, "Copied", "Failed"].map((t) => (
          <span
            key={t}
            aria-hidden={t !== text}
            className={`col-start-1 row-start-1 ${t === text ? "" : "invisible"}`}
          >
            {t}
          </span>
        ))}
      </span>
      <span role="status" className="sr-only">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </button>
  );
}
