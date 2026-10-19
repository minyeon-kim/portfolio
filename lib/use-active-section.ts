"use client";

import { useEffect, useState } from "react";

// Which of the given element ids is the current section: the last one whose
// top has passed `line` (a fraction of the viewport height). Scroll-linked,
// throttled to one check per frame, read-only: it never moves the page.
export function useActiveSection(ids: string[], line = 0.35) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * line) current = id;
      }
      // At the very bottom a short last section can never reach the line; it wins anyway.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && document.getElementById(list[list.length - 1])) current = list[list.length - 1];
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
  }, [key, line]);

  return active;
}
