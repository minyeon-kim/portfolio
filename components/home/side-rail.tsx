"use client";

import { useEffect, useRef } from "react";
import { ScrambleLink } from "@/components/scramble-link";
import { setUi, useUi } from "@/lib/ui-store";
import { Segmented } from "./segmented";

const STAGGER_MS = 50;

type Props = {
  projects: { slug: string; name: string }[];
  pages: { href: string; label: string }[];
};

// Landing page left side (lg+), Metalab-style: a vertical, rounded case picker
// fixed at the left edge, vertically centered, staying put while you read.
// The header's Menu button opens the page links just above it, sliding in one
// by one; Menu again, Esc, or a link folds them away.
export function SideRail({ projects, pages }: Props) {
  const open = useUi((s) => s.menuOpen);
  const active = useUi((s) => s.activeCase);
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
  useEffect(() => () => setUi({ menuOpen: false }), []);

  const select = (i: number) => {
    setUi({ activeCase: i });
    // Picking from deep inside a case jumps back to the start of the new one.
    const caseTop = document.getElementById("case")?.getBoundingClientRect().top ?? 0;
    if (caseTop < 0) document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed top-1/2 left-4 z-30 hidden -translate-y-1/2 lg:block">
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
                className="inline-flex rounded-full bg-bg/60 px-2 py-1 text-base text-ink backdrop-blur-xl transition-colors duration-150 ease-standard hover:bg-bg/85"
              />
            </li>
          ))}
        </ul>
      </nav>

      <Segmented
        label="Selected work"
        orientation="vertical"
        idPrefix="rail"
        options={projects.map((p) => ({ id: p.slug, label: p.name }))}
        value={active}
        onChange={select}
        controls="stage-panel"
      />
    </div>
  );
}
