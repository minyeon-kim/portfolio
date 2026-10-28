"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

// Sticky stage nav for the Devsign case: the last section whose top has passed
// the upper third of the screen is current (so Testing still reads as Deliver);
// links jump to their section with native smooth scroll.
export function DevsignNav({ items }: { items: Item[] }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let next = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) next = id;
      }
      setCurrent(next);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav className="dv-nav" aria-label="Case study sections">
      <ol className="dv-nav-links">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={current === id ? "location" : undefined}>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
