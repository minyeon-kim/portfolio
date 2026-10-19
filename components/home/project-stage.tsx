"use client";

import Image from "next/image";
import { ViewTransition, type ReactNode } from "react";
import { ConceptLabel } from "@/components/case-label";
import { setUi, useUi } from "@/lib/ui-store";
import { Segmented } from "./segmented";

export type StageProject = {
  slug: string;
  name: string;
  title: string;
  problem: string;
  role?: string;
  cover?: string;
  concept?: boolean;
};

// The landing page opener, Metalab-style. The selected case's cover fills the
// screen (running up under the transparent header), an iOS-style segmented
// control in the middle picks the case, and its title sits at the bottom.
// Scrolling hands off to that case's content below: the title drifts up and
// the cover dims (.stage-* in globals.css), and the bottom fade runs straight
// into the content, so there is no hard edge.
export function ProjectStage({ projects, intro }: { projects: StageProject[]; intro: ReactNode }) {
  const active = useUi((s) => s.activeCase);
  const select = (i: number) => setUi({ activeCase: i });

  // Items before the active one have left upward; items after wait below.
  const place = (i: number) =>
    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0";

  return (
    <section
      id="work"
      aria-label="Selected work"
      className="full-bleed relative flex flex-col py-6 md:on-media md:-mt-[67px] md:block md:h-svh md:min-h-[640px] md:bg-bg md:py-0"
    >
      {/* Covers: crossfade and settle from a slight zoom. Phone: a rounded card. */}
      <div className="relative order-2 mx-2 my-4 aspect-[4/3] overflow-clip rounded-lg bg-surface md:absolute md:inset-0 md:m-0 md:aspect-auto md:rounded-none">
        <div className="stage-cover absolute inset-0">
          {projects.map((p, i) =>
            p.cover ? (
              <div
                key={p.slug}
                aria-hidden="true"
                className={`absolute inset-0 transition-[opacity,scale] duration-400 ease-standard ${i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
              >
                <ViewTransition name={`cover-${p.slug}`} share="auto" default="none">
                  <Image src={p.cover} alt="" fill sizes="100vw" priority={i === 0} className="object-cover" />
                </ViewTransition>
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/*
        Legibility (desktop): the stage uses the dark media palette in both
        themes. An even dark tint over the whole image (no top band), and a
        fade at the bottom under the title. The tint deepens as you scroll on;
        the strip after the stage blends into the page background.
      */}
      <div aria-hidden="true" className="stage-tint absolute inset-0 hidden bg-bg/45 md:block" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 hidden h-[45%] bg-[linear-gradient(to_bottom,transparent,var(--bg))] md:block"
      />

      <div className="stage-content contents md:relative md:mx-auto md:grid md:h-full md:max-w-page md:grid-rows-[auto_1fr_auto] md:px-4 md:pt-[115px] md:pb-8">
        <div className="order-1 px-2 md:px-0">{intro}</div>

        {/* Case picker below lg (lg+ uses the vertical picker in the left SideRail) */}
        <div className="order-3 flex justify-center px-2 md:items-center md:px-0 lg:invisible">
          <Segmented
            label="Selected work"
            options={projects.map((p) => ({ id: p.slug, label: p.name }))}
            value={active}
            onChange={select}
            controls="stage-panel"
          />
        </div>

        {/* Title of the selected case; slides up on change. */}
        <div className="order-4 mt-4 flex flex-wrap items-end justify-between gap-2 px-2 md:mt-0 md:px-0">
          <div
            id="stage-panel"
            role="tabpanel"
            aria-label={`${projects[active].name}, selected case`}
            aria-live="polite"
            className="grid min-w-0 flex-1"
          >
            {projects.map((p, i) => (
              <div key={p.slug} aria-hidden={i !== active} className="col-start-1 row-start-1 self-end">
                <div
                  className={`mb-1 flex items-center gap-1 font-mono text-xs text-muted transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                >
                  {p.concept && <ConceptLabel />}
                  {p.role && <span>{p.role}</span>}
                </div>
                <h2
                  className={`mb-1 text-xl font-normal tracking-tight transition-[opacity,translate] duration-400 ease-standard md:max-w-[18ch] md:text-display md:font-light md:tracking-[-0.03em] ${place(i)}`}
                  style={{ transitionDelay: i === active ? "150ms" : "0ms" }}
                >
                  {p.title}
                </h2>
                <p
                  className={`max-w-[52ch] text-base text-muted transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                  style={{ transitionDelay: i === active ? "250ms" : "0ms" }}
                >
                  {p.problem}
                </p>
              </div>
            ))}
          </div>
          <a
            href="#case"
            className="hidden items-center gap-1 font-mono text-xs text-muted transition-colors duration-150 ease-standard hover:text-ink md:inline-flex"
          >
            Scroll to read
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
