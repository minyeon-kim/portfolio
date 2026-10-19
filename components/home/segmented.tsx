"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

type Props = {
  label: string;
  options: { id: string; label: string }[];
  value: number;
  onChange: (index: number) => void;
  controls?: string;
  orientation?: "horizontal" | "vertical";
  idPrefix?: string;
};

// iOS-style segmented control: a frosted rounded track with a solid thumb
// that slides under the selected option, horizontally or vertically.
// Tabs semantics; arrows / Home / End move.
export function Segmented({
  label,
  options,
  value,
  onChange,
  controls,
  orientation = "horizontal",
  idPrefix = "seg",
}: Props) {
  const vertical = orientation === "vertical";
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const b = buttons.current[value];
      if (b) setThumb({ left: b.offsetLeft, top: b.offsetTop, width: b.offsetWidth, height: b.offsetHeight });
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
      ArrowRight: value + 1,
      ArrowDown: value + 1,
      ArrowLeft: value - 1,
      ArrowUp: value - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      move(moves[e.key]);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={`relative inline-flex rounded-lg bg-bg/50 p-0.5 backdrop-blur-xl ${vertical ? "flex-col items-stretch" : ""}`}
    >
      {thumb && (
        <span
          aria-hidden="true"
          className="absolute rounded-full bg-surface transition-[left,top,width,height] duration-250 ease-standard"
          style={thumb}
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
            id={`${idPrefix}-${o.id}`}
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(i)}
            onKeyDown={onKeyDown}
            className={`press relative rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${vertical ? "text-left" : ""} transition-colors duration-250 ease-standard ${
              selected ? "text-ink" : "text-muted hover:text-ink"
            } ${!thumb && selected ? "bg-surface" : ""}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
