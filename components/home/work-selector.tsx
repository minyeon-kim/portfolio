"use client";

import {
  Children,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ConceptLabel } from "@/components/case-label";

export type WorkOption = {
  slug: string;
  cover?: string;
  name: string;
  problem: string;
  role?: string;
  concept?: boolean;
};

// "Selected work" in the same language as the side menu: a big project list
// with a dot marking the selected one, and a large preview that crossfades to
// whichever project you hover. Pick one and its section appears below, its
// pieces revealing one by one. Every panel is rendered
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

  // The preview follows the hovered project and falls back to the selected one.
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? active;

  return (
    <>
      <div id="work" className="pb-6">
        <p className="mb-1 font-mono text-xs text-muted">Selected work</p>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-8">
          <div
            role="tablist"
            aria-label="Selected work"
            aria-orientation="vertical"
            className="border-t border-line"
            onMouseLeave={() => setHovered(null)}
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
                  onMouseEnter={() => setHovered(i)}
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-line py-2 text-left"
                >
                  <span className="flex items-center gap-1 font-mono text-xs text-muted">
                    <span
                      aria-hidden="true"
                      className={`size-1 rounded-md bg-accent transition-transform duration-250 ease-standard ${selected ? "scale-100" : "scale-0 group-hover:scale-75"}`}
                    />
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex flex-wrap items-baseline gap-1 text-xl font-medium tracking-tight transition-[color,translate] duration-250 ease-standard ${selected ? "translate-x-0.5 text-ink" : "text-muted group-hover:translate-x-0.5 group-hover:text-ink"}`}
                  >
                    {o.name}
                    {o.concept && <ConceptLabel />}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs transition-[color,translate] duration-250 ease-standard ${selected ? "translate-y-0.5 text-accent" : "text-muted group-hover:translate-y-0.5"}`}
                  >
                    ↓
                  </span>
                  <span
                    className={`col-start-2 mt-0.5 text-sm transition-colors duration-250 ease-standard ${selected ? "text-muted" : "text-muted/70"}`}
                  >
                    {o.problem}
                  </span>
                  {o.role && (
                    <span className="col-start-2 mt-0.5 font-mono text-xs text-muted">{o.role}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Large preview: covers crossfade to the hovered or selected project. */}
          <Link
            href={`/work/${options[shown].slug}/`}
            aria-label={`Read the ${options[shown].name} case study`}
            className="group relative hidden aspect-[2/1] overflow-clip rounded-md border border-line bg-surface lg:block"
          >
            {options.map((o, i) =>
              o.cover ? (
                <Image
                  key={o.slug}
                  src={o.cover}
                  alt=""
                  width={1600}
                  height={800}
                  sizes="(min-width: 1024px) 620px, 100vw"
                  priority={i === 0}
                  className={`absolute inset-0 size-full object-cover transition-[opacity,scale] duration-400 ease-standard group-hover:scale-[1.02] ${shown === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
                />
              ) : null,
            )}
            <span className="absolute bottom-1 left-1 rounded-md border border-line bg-surface/90 px-1 py-0.5 font-mono text-xs backdrop-blur-sm">
              {String(shown + 1).padStart(2, "0")} · Read the case →
            </span>
          </Link>
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
