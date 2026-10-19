"use client";

import {
  Children,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ConceptLabel } from "@/components/case-label";

export type WorkOption = {
  slug: string;
  name: string;
  problem: string;
  role?: string;
  concept?: boolean;
};

// "Selected work" as tabs: pick a project above, and that project's section
// appears below with its pieces revealing one by one. Every panel is rendered
// on the server (inactive ones `hidden`), so the content is all there without JS.
// Keyboard: arrows / Home / End switch projects, Tab moves into the panel.
export function WorkSelector({ options, children }: { options: WorkOption[]; children: ReactNode }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const firstRender = useRef(true);
  const panelList = Children.toArray(children);

  // Before paint, so the new panel never flashes fully drawn.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const panel = panels.current[active];
    if (panel) window.dispatchEvent(new CustomEvent("reveal:replay", { detail: panel }));
  }, [active]);

  const select = (i: number, focus = false) => {
    const next = (i + options.length) % options.length;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      select(moves[e.key], true);
    }
  };

  const indicator = {
    "--n": options.length,
    "--i": active,
  } as CSSProperties;

  return (
    <>
      <div id="work" className="pb-6">
        <p className="mb-1 font-mono text-xs text-muted">Selected work</p>
        <div
          role="tablist"
          aria-label="Selected work"
          className="relative grid gap-1 pb-1 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]"
          style={indicator}
        >
          {options.map((o, i) => {
            const selected = i === active;
            return (
              <button
                key={o.slug}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tab-${o.slug}`}
                aria-selected={selected}
                aria-controls={`panel-${o.slug}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={onKeyDown}
                className={`group relative flex flex-col items-start gap-0.5 rounded-md border p-2 text-left transition-[border-color,background-color,opacity] duration-250 ease-standard ${
                  selected
                    ? "border-accent bg-surface"
                    : "border-line opacity-60 hover:border-ink hover:bg-surface hover:opacity-100"
                }`}
              >
                <span className="flex w-full items-center gap-1 font-mono text-xs text-muted">
                  <span className={selected ? "text-accent" : ""}>{String(i + 1).padStart(2, "0")}</span>
                  {o.concept && <ConceptLabel />}
                  <span
                    className={`ml-auto transition-[color,translate] duration-250 ease-standard ${
                      selected ? "translate-y-0.5 text-accent" : "group-hover:translate-y-0.5"
                    }`}
                  >
                    {selected ? "Viewing ↓" : "View ↓"}
                  </span>
                </span>
                <span className="text-lg font-medium">{o.name}</span>
                <span className="text-sm text-muted">{o.problem}</span>
                {o.role && <span className="mt-0.5 font-mono text-xs text-muted">{o.role}</span>}
              </button>
            );
          })}
          {/* Accent bar that slides under the selected project (md and up). */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 hidden h-[2px] w-[calc((100%-(var(--n)-1)*8px)/var(--n))] translate-x-[calc(var(--i)*(100%+8px))] rounded-md bg-accent transition-transform duration-400 ease-standard md:block"
          />
        </div>
      </div>

      {panelList.map((panel, i) => (
        <div
          key={options[i].slug}
          ref={(el) => {
            panels.current[i] = el;
          }}
          role="tabpanel"
          id={`panel-${options[i].slug}`}
          aria-labelledby={`tab-${options[i].slug}`}
          hidden={i !== active}
        >
          {panel}
        </div>
      ))}
    </>
  );
}
