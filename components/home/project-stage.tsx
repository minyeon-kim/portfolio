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
// head block holds the selected case's name (large), the positioning line
// (small, top right) and a facts row; the cover fills the rest of the screen
// below it, clean, with no text on it. Scrolling hands off to the case content.
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
      className="full-bleed relative flex flex-col py-6 md:on-media md:-mt-[67px] md:h-svh md:min-h-[720px] md:bg-bg md:py-0"
    >
      {/*
        Head block (solid background), like a Metalab case header: the selected
        case's name large on the left, the positioning line small at the top
        right, and a facts row (Problem / Role / Timeline) along the bottom.
      */}
      <div className="order-1 px-2 md:px-4 md:pt-[115px] md:pb-4">
        <div className="mx-auto max-w-page">
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:gap-8">
            <div className="hidden md:grid">
              {projects.map((p, i) => (
                <div key={p.slug} aria-hidden={i !== active} className="col-start-1 row-start-1">
                  <div
                    className={`mb-1 h-2.5 transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                  >
                    {p.concept && <ConceptLabel />}
                  </div>
                  <h2
                    className={`text-display font-light tracking-[-0.03em] transition-[opacity,translate] duration-400 ease-standard ${place(i)}`}
                    style={{ transitionDelay: i === active ? "150ms" : "0ms" }}
                  >
                    {p.title}
                  </h2>
                </div>
              ))}
            </div>
            <div className="md:pt-3">{intro}</div>
          </div>

          <div className="mt-8 hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 md:grid">
            {(["Problem", "Role", "Timeline"] as const).map((label, col) => (
              <div key={label}>
                <p className="mb-0.5 text-sm">{label}</p>
                <div className="grid">
                  {projects.map((p, i) => (
                    <p
                      key={p.slug}
                      aria-hidden={i !== active}
                      className={`col-start-1 row-start-1 text-sm text-muted transition-[opacity,translate] duration-400 ease-standard ${place(i)} ${col === 0 ? "max-w-[52ch]" : ""}`}
                      style={{ transitionDelay: i === active ? `${250 + col * 50}ms` : "0ms" }}
                    >
                      {(label === "Problem" ? p.problem : label === "Role" ? p.role : p.timeline) ?? "—"}
                    </p>
                  ))}
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
        {/* The cover darkens as you scroll on into the case (desktop). */}
        <div aria-hidden="true" className="stage-tint absolute inset-0 hidden bg-bg/0 md:block" />

        <a
          href="#case"
          className="stage-content absolute right-4 bottom-4 hidden items-center gap-1 rounded-full bg-bg/60 px-2 py-1 font-mono text-xs text-ink backdrop-blur-xl transition-colors duration-150 ease-standard hover:bg-bg/85 md:inline-flex"
        >
          Scroll to read
          <span aria-hidden="true">↓</span>
        </a>
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
