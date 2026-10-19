"use client";

import { useEffect, useRef, type ElementType } from "react";

// Statement text that fills in word by word, muted to ink, as it scrolls up
// through the screen. Server-rendered fully inked; words only start muted once
// this script arms it, and never with reduced motion.
export function FillText({
  text,
  as: Tag = "p",
  className = "",
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spans = [...el.querySelectorAll<HTMLElement>("[data-word]")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the text's top reaches 85% of the screen, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const travel = start - vh * 0.45 + box.height;
      const progress = Math.min(1, Math.max(0, (start - box.top) / travel));
      const lit = Math.round(progress * spans.length);
      spans.forEach((s, i) => s.toggleAttribute("data-lit", i < lit));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    el.setAttribute("data-armed", "");
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      el.removeAttribute("data-armed");
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [text]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          data-word=""
          className="transition-colors duration-250 ease-standard in-data-armed:not-data-lit:text-muted"
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
