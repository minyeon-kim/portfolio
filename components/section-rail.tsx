"use client";

import type { TocItem } from "@/lib/cases";
import { useActiveSection } from "@/lib/use-active-section";

// Fixed dot rail on the right edge (desktop): shows where you are on the
// landing page; each dot is a plain anchor link, so it works without JS.
export function SectionRail({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items.map((i) => i.id));

  return (
    <nav
      aria-label="Sections"
      className="fixed top-1/2 right-2 z-20 hidden -translate-y-1/2 xl:block"
    >
      <ul className="flex flex-col items-end gap-1">
        {items.map(({ id, label }) => {
          const current = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={current ? "location" : undefined}
                className="group flex items-center gap-1 rounded-md py-0.5 pl-1"
              >
                <span
                  className={`font-mono text-xs transition-opacity duration-250 ease-standard ${current ? "text-ink opacity-100" : "text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                >
                  {label}
                </span>
                <span
                  aria-hidden="true"
                  className={`block h-[2px] rounded-md transition-[width,background-color] duration-250 ease-standard ${current ? "w-3 bg-accent" : "w-1.5 bg-line group-hover:bg-muted"}`}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
