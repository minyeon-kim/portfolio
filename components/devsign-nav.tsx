"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

// Stage nav for the Devsign case, a floating pill at the bottom of the screen so
// it never stacks with the header. It shows only while the case body is on
// screen. The last section whose top has passed the upper third of the screen is
// current; links jump to their section with native smooth scroll.
export function DevsignNav({ items }: { items: Item[] }) {
  const [current, setCurrent] = useState(items[0]?.id);
  const [shown, setShown] = useState(false);
  const list = useRef<HTMLOListElement>(null);

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
      const first = document.getElementById(items[0]?.id);
      const last = document.getElementById(items[items.length - 1]?.id);
      setShown(!!first && !!last && first.getBoundingClientRect().top <= window.innerHeight * 0.7 && last.getBoundingClientRect().bottom >= window.innerHeight * 0.7);
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

  // On phones the list scrolls sideways: keep the current stage in view.
  useEffect(() => {
    const el = list.current;
    const link = el?.querySelector<HTMLElement>('[aria-current]');
    if (!el || !link || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = link.offsetLeft - (el.clientWidth - link.offsetWidth) / 2;
  }, [current]);

  return (
    <nav className="dv-nav" data-shown={shown} aria-label="Case study sections">
      <ol ref={list} className="dv-nav-links">
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
