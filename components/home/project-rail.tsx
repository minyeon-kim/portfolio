"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ScrambleLink } from "@/components/scramble-link";
import { setUi, useUi } from "@/lib/ui-store";

type Props = {
  projects: { slug: string; name: string }[];
  pages: { href: string; label: string }[];
};

const STAGGER_MS = 50;

// Landing page left side, Metalab-style (md and up): a floating pill list that
// picks the case shown on the stage. The header's Menu button opens the page
// links inline, sliding in one by one above the list; Esc or Menu again folds
// them away. The links keep their space when hidden, so the list never moves.
export function ProjectRail({ projects, pages }: Props) {
  const open = useUi((s) => s.menuOpen);
  const active = useUi((s) => s.activeCase);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstLink = useRef<HTMLDivElement>(null);

  // Esc closes the inline menu and returns focus to the Menu button.
  useEffect(() => {
    if (!open) return;
    firstLink.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setUi({ menuOpen: false });
      document.getElementById("menu-button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Leaving the landing page folds the menu.
  useEffect(() => () => setUi({ menuOpen: false }), []);

  const select = (i: number, focus = false) => {
    const next = (i + projects.length) % projects.length;
    setUi({ activeCase: next });
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: projects.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      select(moves[e.key], true);
    }
  };

  return (
    <div className="fixed bottom-8 left-4 z-20 hidden flex-col items-start md:flex">
      <nav id="inline-menu" aria-label="Site" inert={!open} className="mb-4">
        <div ref={firstLink}>
          <ul className="space-y-0.5">
            {pages.map((p, i) => (
              <li
                key={p.href}
                className={`transition-[opacity,translate] duration-250 ease-standard ${open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}
                // Open: top to bottom. Close: all together, quickly.
                style={{ transitionDelay: open ? `${i * STAGGER_MS}ms` : "0ms" }}
              >
                <ScrambleLink
                  href={p.href}
                  label={p.label}
                  onClick={() => setUi({ menuOpen: false })}
                  className="text-lg tracking-tight text-ink hover:text-accent"
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <p className="mb-1 font-mono text-xs text-muted">
        Selected work · {String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
      </p>
      <div role="tablist" aria-label="Selected work" aria-orientation="vertical" className="flex flex-col items-start gap-0.5">
        {projects.map((p, i) => {
          const selected = i === active;
          return (
            <button
              key={p.slug}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`rail-tab-${p.slug}`}
              aria-selected={selected}
              aria-controls="stage-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={onKeyDown}
              className={`press flex items-center gap-1 rounded-full px-2 py-1 text-base backdrop-blur-md transition-colors duration-250 ease-standard ${
                selected ? "bg-ink text-bg" : "bg-bg/60 text-ink hover:bg-bg/85"
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-1 rounded-full bg-accent transition-[scale,margin] duration-250 ease-standard ${selected ? "scale-100" : "-mr-1 scale-0"}`}
              />
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
