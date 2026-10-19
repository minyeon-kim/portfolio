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
  timeline?: string;
  tools?: string;
  cover?: string;
  concept?: boolean;
};

// The landing page opener, laid out like a Metalab case header. A solid dark
// head block holds the positioning line and the selected case's facts (Role /
// Timeline / Tools); the cover fills the rest of the screen below it, with the
// case title on its lower part. Text never sits on the image except the title,
// which has a fade under it. Scrolling hands off to the case content below.
export function ProjectStage({ projects, intro }: { projects: StageProject[]; intro: ReactNode }) {
  const active = useUi((s) => s.activeCase);
  const select = (i: number) => setUi({ activeCase: i });

  // Items before the active one have left upward; items after wait below.
  const place = (i: number) =>
    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0";

  const facts = (p: StageProject) =>
    [
      { label: "Role", value: p.role },
      { label: "Timeline", value: p.timeline },
      { label: "Tools", value: p.tools },
    ].filter((f) => f.value);

  return (
    <section
      id="work"
      aria-label="Selected work"
      className="full-bleed relative flex flex-col py-6 md:on-media md:-mt-[67px] md:h-svh md:min-h-[720px] md:bg-bg md:py-0"
    >
      {/* Head block: solid background, positioning line, the selected case's facts. */}
      <div className="order-1 px-2 md:px-4 md:pt-[115px] md:pb-4">
        <div className="mx-auto max-w-page">
          {intro}
          <div className="mt-6 hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 md:grid">
            {["Role", "Timeline", "Tools"].map((label, col) => (
              <div key={label} className="grid">
                <p className="mb-0.5 text-sm">{label}</p>
                <div className="grid">
                  {projects.map((p, i) => {
                    const fact = facts(p).find((f) => f.label === label);
                    return (
                      <p
                        key={p.slug}
                        aria-hidden={i !== active}
                        className={`col-start-1 row-start-1 text-sm text-muted transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                        style={{ transitionDelay: i === active ? `${col * 50}ms` : "0ms" }}
                      >
                        {fact?.value ?? "—"}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cover area: fills the rest of the screen. Phone: a rounded card. */}
      <div className="relative order-2 mx-2 my-4 aspect-[4/3] overflow-clip rounded-lg bg-surface md:m-0 md:aspect-auto md:flex-1 md:rounded-none">
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
        {/* Desktop: a fade under the title only, deepening as you scroll on. */}
        <div aria-hidden="true" className="stage-tint absolute inset-0 hidden bg-bg/10 md:block" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden h-[75%] bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--bg)_75%,transparent)_45%,var(--bg)_85%)] md:block"
        />

        {/* Title of the selected case, on the lower part of the cover (desktop). */}
        <div className="stage-content absolute inset-x-0 bottom-0 hidden px-4 pb-8 md:block">
          <div className="mx-auto flex max-w-page flex-wrap items-end justify-between gap-2">
            <TitleBlock id="stage-panel" projects={projects} active={active} place={place} />
            <a
              href="#case"
              className="inline-flex items-center gap-1 font-mono text-xs text-muted transition-colors duration-150 ease-standard hover:text-ink"
            >
              Scroll to read
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* Phones: picker and title stacked under the cover card. */}
      <div className="order-3 flex justify-center px-2 md:hidden">
        <Segmented
          label="Selected work"
          options={projects.map((p) => ({ id: p.slug, label: p.name }))}
          value={active}
          onChange={select}
          controls="stage-panel-phone"
        />
      </div>
      <div className="order-4 mt-4 px-2 md:hidden">
        <TitleBlock id="stage-panel-phone" projects={projects} active={active} place={place} />
      </div>
    </section>
  );
}

function TitleBlock({
  id,
  projects,
  active,
  place,
}: {
  id: string;
  projects: StageProject[];
  active: number;
  place: (i: number) => string;
}) {
  return (
    <div
      id={id}
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
  );
}
