"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/cases";

// Reading progress bar (all sizes) and sticky table of contents (desktop only)
// for a case study. The article body must have id="case-body".
export function CaseNav({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = document.getElementById("case-body");
    if (!body) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const box = body.getBoundingClientRect();
      const scrollable = box.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -box.top / scrollable)) : 1;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;

      // The current section is the last heading above 30% of the viewport.
      let current = items[0]?.id;
      for (const { id } of items) {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top <= window.innerHeight * 0.3) {
          current = id;
        }
      }
      setActive(current);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <>
      <div
        ref={bar}
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-10 h-[2px] origin-left bg-accent"
        style={{ transform: "scaleX(0)" }}
      />
      <nav aria-label="On this page" className="sticky top-4 hidden lg:block">
        <p className="mb-1 font-mono text-xs text-muted">On this page</p>
        <ul className="border-l border-line font-mono text-xs">
          {items.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                className="-ml-px block border-l border-transparent py-0.5 pl-2 text-muted transition-colors duration-150 ease-standard hover:text-ink aria-[current=location]:border-accent aria-[current=location]:text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
