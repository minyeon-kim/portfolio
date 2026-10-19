"use client";

import { useEffect, useRef } from "react";
import { ScrambleLink } from "@/components/scramble-link";
import { setUi, useUi } from "@/lib/ui-store";
import { CasePills } from "./case-pills";

const STAGGER_MS = 50;

type Props = {
  projects: { slug: string; name: string }[];
  pages: { href: string; label: string }[];
};

// Landing page left side (lg+), Metalab-style: separate case pills fixed at
// the left edge, vertically centered, always in the dark media palette. It
// belongs to the stage: it fades away once you scroll into the case and
// returns at the top.
// The header's Menu button opens the page links just above it, sliding in one
// by one; Menu again, Esc, or a link folds them away.
export function SideRail({ projects, pages }: Props) {
  const open = useUi((s) => s.menuOpen);
  const active = useUi((s) => s.activeCase);
  const visible = useUi((s) => s.railVisible);
  const links = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    links.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setUi({ menuOpen: false });
      document.getElementById("menu-button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
      setUi(show ? { railVisible: true } : { railVisible: false, menuOpen: false });
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
      className={`on-media fixed top-[62%] left-4 z-30 hidden -translate-y-1/2 transition-[opacity,translate] duration-250 ease-standard lg:block ${
        visible ? "opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
      }`}
    >
      {/* Page links, attached above the picker so the picker never moves. */}
      <nav id="inline-menu" aria-label="Site" inert={!open} className="absolute bottom-full left-0 mb-2">
        <ul ref={links} className="space-y-0.5">
          {pages.map((p, i) => (
            <li
              key={p.href}
              className={`transition-[opacity,translate] duration-250 ease-standard ${open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}
              style={{ transitionDelay: open ? `${(pages.length - 1 - i) * STAGGER_MS}ms` : "0ms" }}
            >
              <ScrambleLink
                href={p.href}
                label={p.label}
                onClick={() => setUi({ menuOpen: false })}
                className="inline-flex rounded-full bg-bg/60 px-2 py-1 text-base text-ink backdrop-blur-xl transition-colors duration-150 ease-standard hover:bg-bg/80"
              />
            </li>
          ))}
        </ul>
      </nav>

      <CasePills
        label="Selected work"
        options={projects.map((p) => ({ id: p.slug, label: p.name }))}
        value={active}
        onChange={select}
        controls="stage-panel"
      />
    </div>
  );
}
