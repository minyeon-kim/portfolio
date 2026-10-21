"use client";

import { useEffect } from "react";
import { setUi, useUi } from "@/lib/ui-store";
import { CasePills } from "./case-pills";

type Props = {
  projects: { slug: string; name: string }[];
};

// Landing page left side (lg+), Metalab-style: separate case pills fixed at
// the left edge, vertically centered, always in the dark media palette. It
// belongs to the stage: it fades away once you scroll into the case and
// returns at the top.
export function SideRail({ projects }: Props) {
  const active = useUi((s) => s.activeCase);
  const visible = useUi((s) => s.railVisible);
  // Leaving the landing page folds the menu.
  useEffect(() => () => setUi({ menuOpen: false, railVisible: true }), []);

  // The picker belongs to the stage: it fades away once you scroll into the
  // case (past half a screen) and comes back at the top.
  useEffect(() => {
    let frame = 0;
    let lastShown: boolean | null = null;
    const update = () => {
      frame = 0;
      const show = window.scrollY < window.innerHeight * 0.5;
      if (show === lastShown) return;
      lastShown = show;
      setUi({ railVisible: show });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  const select = (i: number) => setUi({ activeCase: i });

  return (
    <div
      inert={!visible}
      className={`project-rail fixed bottom-12 z-30 hidden transition-[opacity,translate] duration-250 ease-standard lg:block ${
        visible ? "opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
      }`}
    >
      {active !== null && <CasePills
        label="Selected work"
        options={projects.map((p) => ({ id: p.slug, label: p.name }))}
        value={active}
        onChange={select}
        controls="stage-panel"
      />}
    </div>
  );
}
