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
  cover?: string;
  concept?: boolean;
};

type Props = { projects: StageProject[]; name: string; intro: ReactNode };

// The landing page opener, in two states.
// Intro (nothing picked): the name and positioning line, emphasized, and the
// case pills to choose from. Nothing sits below, so there is nothing to scroll.
// Selected: the case name and facts in a solid head block, and the case's
// screen as a rounded card rising in below. Scrolling grows that card to the
// full screen (scroll-linked, .stage-card in globals.css), then the case
// content follows. The header name returns to the intro.
export function ProjectStage({ projects, name, intro }: Props) {
  const active = useUi((s) => s.activeCase);
  const select = (i: number) => setUi({ activeCase: i });
  const p = active === null ? null : projects[active];

  return (
    <section
      id="work"
      aria-label={p ? `${p.name}, selected case` : "Introduction"}
      className="full-bleed relative flex min-h-svh flex-col pt-6 pb-6 md:on-media md:-mt-[67px] md:h-svh md:min-h-[720px] md:bg-bg md:pt-0 md:pb-0"
    >
      {p === null ? (
        <IntroState name={name} intro={intro} />
      ) : (
        <SelectedState key={p.slug} project={p} />
      )}

      {/* Phones: the picker sits in the flow (lg+ uses the left SideRail). */}
      <div className="order-3 mt-4 flex justify-center px-2 md:hidden">
        <Segmented
          label="Selected work"
          options={projects.map((x) => ({ id: x.slug, label: x.name }))}
          value={active}
          onChange={select}
        />
      </div>
    </section>
  );
}

function IntroState({ name, intro }: { name: string; intro: ReactNode }) {
  return (
    <div className="order-1 flex flex-1 flex-col justify-end px-2 md:px-4 md:pb-16">
      <div className="mx-auto w-full max-w-page lg:pl-[200px]">
        <p className="animate-[rise-in_400ms_var(--ease)_both] text-xl font-light tracking-tight md:text-display md:tracking-[-0.03em]">
          {name}
        </p>
        <div className="mt-2 max-w-[38ch] animate-[rise-in_400ms_var(--ease)_150ms_both]">{intro}</div>
        <p className="mt-6 hidden animate-[rise-in_400ms_var(--ease)_250ms_both] font-mono text-xs text-muted lg:block">
          ← Select a project
        </p>
      </div>
    </div>
  );
}

function SelectedState({ project: p }: { project: StageProject }) {
  const facts = [
    { label: "Problem", value: p.problem },
    { label: "Role", value: p.role },
    { label: "Timeline", value: p.timeline },
  ];

  return (
    <>
      {/* Head block: case name and facts, rising in. */}
      <div className="order-1 px-2 md:px-4 md:pt-[115px] md:pb-4">
        <div className="mx-auto max-w-page lg:pl-[200px]">
          <div className="mb-1 h-2.5 animate-[rise-in_400ms_var(--ease)_both]">{p.concept && <ConceptLabel />}</div>
          <h2 className="animate-[rise-in_400ms_var(--ease)_both] text-xl font-normal tracking-tight md:text-display md:font-light md:tracking-[-0.03em]">
            {p.title}
          </h2>
          <dl className="mt-6 hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 md:grid">
            {facts.map((f, i) => (
              <div
                key={f.label}
                className="animate-[rise-in_400ms_var(--ease)_both]"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                <dt className="mb-0.5 text-sm">{f.label}</dt>
                <dd className={`text-sm text-muted ${i === 0 ? "max-w-[52ch]" : ""}`}>{f.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-base text-muted md:hidden">{p.problem}</p>
        </div>
      </div>

      {/*
        The case's screen: appears as a rounded card, then grows to the full
        screen as you scroll (scroll-linked clip; static where unsupported).
      */}
      <div className="relative order-2 mt-4 flex-1 md:mt-0">
        <div className="mx-2 aspect-[4/3] animate-[card-in_400ms_var(--ease)_250ms_both] overflow-clip rounded-lg bg-surface md:absolute md:inset-0 md:mx-0 md:aspect-auto md:rounded-none">
          <div className="stage-card relative size-full overflow-clip bg-surface">
            {p.cover && (
              <ViewTransition name={`cover-${p.slug}`} share="auto" default="none">
                <Image src={p.cover} alt="" fill sizes="100vw" priority className="object-cover" />
              </ViewTransition>
            )}
            <a
              href="#case"
              className="stage-content absolute right-4 bottom-4 hidden items-center gap-1 rounded-full bg-bg/60 px-2 py-1 font-mono text-xs text-ink backdrop-blur-xl transition-colors duration-150 ease-standard hover:bg-bg/85 md:inline-flex"
            >
              Scroll to read
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
