"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

type Props = {
  label: string;
  options: { id: string; label: string }[];
  value: number;
  onChange: (index: number) => void;
  controls?: string;
};

// Metalab-style case list: separate frosted pills stacked with a gap, the
// selected one marked by an outline ring that slides between them.
// Tabs semantics; arrows / Home / End move.
export function CasePills({ label, options, value, onChange, controls }: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [ring, setRing] = useState<{ top: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const b = buttons.current[value];
      if (b) setRing({ top: b.offsetTop, width: b.offsetWidth, height: b.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [value]);

  const move = (i: number) => {
    const next = (i + options.length) % options.length;
    onChange(next);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowDown: value + 1,
      ArrowRight: value + 1,
      ArrowUp: value - 1,
      ArrowLeft: value - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      move(moves[e.key]);
    }
  };

  return (
    <div role="tablist" aria-label={label} aria-orientation="vertical" className="relative flex flex-col items-start gap-1">
      {ring && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 rounded-full ring-1 ring-ink transition-[top,width,height] duration-250 ease-standard"
          style={ring}
        />
      )}
      {options.map((o, i) => {
        const selected = i === value;
        return (
          <button
            key={o.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            role="tab"
            id={`rail-${o.id}`}
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={onKeyDown}
            className={`press rounded-full bg-bg/60 px-2 py-1 text-base whitespace-nowrap backdrop-blur-xl transition-colors duration-250 ease-standard hover:bg-bg/80 ${
              selected ? "text-ink" : "text-ink/80 hover:text-ink"
            } ${!ring && selected ? "ring-1 ring-ink" : ""}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
