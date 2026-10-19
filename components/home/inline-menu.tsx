"use client";

import { useEffect, useRef } from "react";
import { ScrambleLink } from "@/components/scramble-link";
import { setUi, useUi } from "@/lib/ui-store";

const STAGGER_MS = 50;

// Landing page (md+): the header's Menu button opens the page links here, at
// the left edge, vertically centered, sliding in one by one. Menu again, Esc,
// or following a link folds them away; focus returns to the Menu button.
export function InlineMenu({ pages }: { pages: { href: string; label: string }[] }) {
  const open = useUi((s) => s.menuOpen);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
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

  return (
    <nav
      id="inline-menu"
      aria-label="Site"
      inert={!open}
      className="fixed top-1/2 left-4 z-30 hidden -translate-y-1/2 md:block"
    >
      <ul ref={list} className="space-y-0.5">
        {pages.map((p, i) => (
          <li
            key={p.href}
            className={`transition-[opacity,translate] duration-250 ease-standard ${open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}
            style={{ transitionDelay: open ? `${i * STAGGER_MS}ms` : "0ms" }}
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
  );
}
