"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, ViewTransition, type KeyboardEvent, type ReactNode } from "react";
import { ConceptLabel } from "@/components/case-label";
import { setUi, useUi } from "@/lib/ui-store";

export type StageProject = {
  slug: string;
  name: string;
  title: string;
  problem: string;
  role?: string;
  cover?: string;
  concept?: boolean;
};

// The landing page, Metalab-style: one full-bleed screen. The selected
// project's cover fills the background and its title block slides in while
// the cover crossfades. The picker is the floating left rail on md+, and a
// pill list inside the stage on phones. One project
// at a time, nothing else competing. Keyboard: arrows / Home / End switch.
export function ProjectStage({ projects, intro }: { projects: StageProject[]; intro: ReactNode }) {
  // Selection is shared with the left rail (md+), which is the picker there.
  const active = useUi((s) => s.activeCase);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Items before the active one have left upward; items after wait below.
  const place = (i: number) =>
    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0";

  return (
    <section
      id="work"
      aria-label="Selected work"
      // Desktop: one full-bleed screen with the cover behind everything.
      // Phone: stacked (intro, cover card, list, title) so text never sits on the image.
      className="full-bleed relative flex flex-col overflow-clip py-6 md:block md:h-[calc(100svh-67px)] md:min-h-[600px] md:bg-surface md:py-0"
    >
      {/* Covers: crossfade and settle from a slight zoom. */}
      <div className="relative order-2 mx-2 my-4 aspect-[4/3] overflow-clip rounded-lg bg-surface md:absolute md:inset-0 md:m-0 md:aspect-auto md:rounded-none">
        {projects.map((p, i) =>
          p.cover ? (
            <div
              key={p.slug}
              aria-hidden="true"
              className={`absolute inset-0 transition-[opacity,scale] duration-400 ease-standard ${i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
            >
              <ViewTransition name={`cover-${p.slug}`} share="auto" default="none">
                <Image
                  src={p.cover}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              </ViewTransition>
            </div>
          ) : null,
        )}
      </div>

      {/* Scrims keep text readable over the cover, in both themes (desktop only). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block bg-[linear-gradient(to_bottom,var(--bg)_0%,color-mix(in_srgb,var(--bg)_80%,transparent)_20%,transparent_42%,transparent_48%,color-mix(in_srgb,var(--bg)_88%,transparent)_70%,var(--bg)_86%)]"
      />

      <div className="contents md:relative md:mx-auto md:flex md:h-full md:max-w-page md:flex-col md:justify-between md:px-4 md:pt-8 md:pb-8">
        <div className="order-1 px-2 md:px-0">{intro}</div>

        <div className="order-3 grid items-end gap-4 px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:px-0">
          {/* Phone picker; on md+ the left rail (ProjectRail) picks instead. */}
          <div className="md:hidden">
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
                    id={`tab-${p.slug}`}
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

          {/* Title block for the selected project; slides up on change. */}
          <div
            id="stage-panel"
            role="tabpanel"
            aria-label={`${projects[active].name}, selected case`}
            aria-live="polite"
            // md+: the left column is left empty for the floating rail.
            className="grid md:col-start-2"
          >
            {projects.map((p, i) => (
              <div
                key={p.slug}
                aria-hidden={i !== active}
                inert={i !== active}
                className="col-start-1 row-start-1 self-end"
              >
                <div className={`mb-1 flex items-center gap-1 font-mono text-xs text-muted transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}>
                  {p.concept && <ConceptLabel />}
                  {p.role && <span>{p.role}</span>}
                </div>
                <h2
                  className={`mb-2 text-xl font-normal tracking-tight transition-[opacity,translate] duration-400 ease-standard md:text-display md:font-light md:tracking-[-0.03em] ${place(i)}`}
                  style={{ transitionDelay: i === active ? "150ms" : "0ms" }}
                >
                  {p.title}
                </h2>
                <div
                  className={`flex flex-wrap items-end justify-between gap-2 transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                  style={{ transitionDelay: i === active ? "250ms" : "0ms" }}
                >
                  <p className="max-w-[46ch] text-base text-muted">{p.problem}</p>
                  <Link
                    href={`/work/${p.slug}/`}
                    className="group press inline-flex h-5 items-center gap-1 rounded-full bg-ink px-2 text-sm text-bg transition-colors duration-150 ease-standard hover:bg-accent"
                  >
                    View case
                    <span aria-hidden="true" className="transition-transform duration-250 ease-standard group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
