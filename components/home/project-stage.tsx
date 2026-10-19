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
// Selected (Metalab-style): the case's screen as a small card at the top
// right over a blurred backdrop, its role and timeline, the name large at the
// bottom and the problem at the bottom right. Scrolling grows the card to the
// full screen (scroll-linked, .stage-grow in globals.css), then the case
// content follows. The header name returns to the intro.
export function ProjectStage({ projects, name, intro }: Props) {
  const active = useUi((s) => s.activeCase);
  const select = (i: number) => setUi({ activeCase: i });
  const p = active === null ? null : projects[active];

  return (
    <section
      id="work"
      aria-label={p ? `${p.name}, selected case` : "Introduction"}
      // Selected: .stage-pin adds ~70vh of scroll during which the stage stays put
      // (sticky) while the card grows; see globals.css. Intro: one screen.
      className={`full-bleed md:on-media md:-mt-[67px] md:bg-bg ${p ? "stage-pin" : ""}`}
    >
      <div className="relative flex min-h-svh flex-col pt-6 pb-6 md:sticky md:top-0 md:h-svh md:min-h-[720px] md:overflow-clip md:pt-0 md:pb-0">
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
  const meta = [p.role, p.timeline].filter(Boolean).join(" · ");

  return (
    <>
      {/* Desktop backdrop: the same image, blurred and dark, behind everything. */}
      {p.cover && (
        <div aria-hidden="true" className="absolute inset-0 hidden overflow-clip md:block">
          <Image src={p.cover} alt="" fill sizes="100vw" className="scale-110 object-cover opacity-30 blur-2xl" />
        </div>
      )}

      {/* Phones: name and problem above the card. */}
      <div className="order-1 px-2 md:hidden">
        <div className="mb-1 h-2.5">{p.concept && <ConceptLabel />}</div>
        <h2 className="animate-[rise-in_400ms_var(--ease)_both] text-xl font-normal tracking-tight">{p.title}</h2>
        <p className="mt-2 text-base text-muted">{p.problem}</p>
      </div>

      {/*
        The case's screen. It appears as a small card at the top right; as you
        scroll, it grows to fill the whole screen (.stage-grow: scroll-linked
        position and size, never pinned). Without scroll timelines it simply
        stays a card. Phones: a rounded card in the flow.
      */}
      <div className="stage-grow relative order-2 mx-2 mt-4 aspect-[4/3] overflow-clip rounded-lg md:absolute md:top-[14%] md:left-[54%] md:m-0 md:aspect-auto md:h-[42%] md:w-[37%]">
        {/* Inner layer: the appear animation (the outer one runs the scroll growth). */}
        <div className="relative size-full animate-[card-in_400ms_var(--ease)_150ms_both] bg-surface">
          {p.cover && (
            <ViewTransition name={`cover-${p.slug}`} share="auto" default="none">
              <Image src={p.cover} alt="" fill sizes="100vw" priority className="object-cover" />
            </ViewTransition>
          )}
        </div>
      </div>

      {/* Desktop text over the backdrop; fades as the card takes over. */}
      <div className="stage-content pointer-events-none absolute inset-0 hidden md:block">
        <div className="relative mx-auto h-full max-w-page px-4 lg:pl-[232px]">
          {meta && (
            <p className="absolute top-[28%] animate-[rise-in_400ms_var(--ease)_both] text-base">{meta}</p>
          )}
          <div className="absolute right-4 bottom-[10%] left-4 flex items-end justify-between gap-8 lg:left-[232px]">
            <div className="min-w-0">
              <div className="mb-1 h-2.5 animate-[rise-in_400ms_var(--ease)_150ms_both]">
                {p.concept && <ConceptLabel />}
              </div>
              <h2 className="max-w-[16ch] animate-[rise-in_400ms_var(--ease)_150ms_both] text-display font-light tracking-[-0.03em]">
                {p.title}
              </h2>
            </div>
            <p className="max-w-[28ch] shrink-0 animate-[rise-in_400ms_var(--ease)_250ms_both] text-base">{p.problem}</p>
          </div>
        </div>
      </div>
    </>
  );
}
