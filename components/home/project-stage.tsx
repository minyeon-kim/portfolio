"use client";

import { useStrings } from "@/lib/use-locale";
import { useLayoutEffect } from "react";
import Image from "next/image";
import { ProjectTitle } from "@/components/project-title";
import { HomeIntro } from "./home-intro";
import { setUi, useUi } from "@/lib/ui-store";
import { revealNextProject } from "@/lib/project-transition";
import { Segmented } from "./segmented";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { DevsignLoop } from "@/components/devsign-loop";
import { DevsignHero, type DevsignHeroData } from "@/components/devsign-hero";
import { DEVSIGN_URL } from "@/components/devsign-live";
import { withBase } from "@/lib/site";

export type StageProject = {
  slug: string;
  name: string;
  title: string;
  problem: string;
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
  hero?: DevsignHeroData; // Figma-style opener instead of the title and growing cover
};

type Props = { projects: StageProject[] };

// Project selection opens an editorial heading and full-width cover.
export function ProjectStage({ projects }: Props) {
  const t = useStrings();
  const active = useUi((s) => s.activeCase);
  // Reset after React commits the new stage, rather than before its old body
  // unmounts (browser scroll anchoring can otherwise restore the reading offset).
  useLayoutEffect(() => {
    if (active === null) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [active]);
  // From a case pill, the hovered device grows to the screen and settles into
  // the opener's media frame; from elsewhere (segmented control, More work)
  // the page just rises in.
  const select = (index: number, from?: HTMLElement | null) => {
    const project = projects[index];
    revealNextProject(
      () => setUi({ activeCase: index }),
      () => Boolean(document.querySelector(`main [data-stage-index="${index}"]`)),
      from && project?.hero ? { from, to: "main .devsign-hero-media", project: project.slug, live: project.slug === "workflow-app" ? DEVSIGN_URL : undefined } : undefined,
    );
  };
  const p = active !== null ? projects[active] : null;

  return (
    <>
      {active === null && <HomeIntro projects={projects} onSelect={select} />}
      {p && (
      <section id="work" aria-label={`${p.name}, selected case`} className={p.hero ? "project-selected full-bleed md:-mt-[64px]" : "project-selected stage-pin full-bleed md:-mt-[64px]"}>
        <div key={p.slug} id="stage-panel" data-stage-index={active} className={p.hero ? "selected-stage selected-stage-hero" : "selected-stage"} data-canvas={(p.slug === "workflow-app" && !p.hero) || undefined} data-gemini={p.slug === "gemini-privacy" || undefined}>
          {p.hero ? <DevsignHero hero={p.hero} name={p.name} project={p.slug} alt={p.slug === "gemini-privacy" ? `${p.name}: the source sheet opens and Gmail is switched off` : `${p.name}: a drifted button is flagged, reviewed and approved`} /> : <>
          <div className="stage-content selected-stage-copy">
            <p className="selected-stage-index">{t.project} {(active ?? 0) + 1}</p>
            <h1 tabIndex={-1} className="selected-stage-title generated-title"><ProjectTitle name={p.name} gemini={p.slug === "gemini-privacy"} /></h1>
            <dl className="selected-stage-meta">
              <div><dt>{t.projectType}</dt><dd>{p.concept ? t.conceptProject : t.product}</dd></div>
              {p.role && <div><dt>{t.role}</dt><dd>{p.role}</dd></div>}
              {p.timeline && <div><dt>{t.timeline}</dt><dd>{p.timeline}</dd></div>}
            </dl>
          </div>
          <div className="stage-grow selected-stage-object">
            <div className="generated-frame"><div className="generated-preview">{p.slug === "gemini-privacy"
              ? <GeminiDevice><GeminiPhone alt={`${p.name}: the source sheet opens and Gmail is switched off`} /></GeminiDevice>
              : p.slug === "workflow-app"
                ? <DevsignLoop alt={`${p.name}: a drifted button is flagged, reviewed and approved`} />
                : p.cover && <Image src={withBase(p.cover)} alt={`${p.name} project overview`} fill sizes="100vw" preload className="object-cover" />}</div></div>
          </div>
          </>}
          <div className="selected-stage-picker flex justify-center px-2 py-3 lg:hidden">
            <Segmented label={t.selectedWork} options={projects.map((x) => ({ id: x.slug, label: x.name }))} value={active} onChange={select} />
          </div>
        </div>
      </section>
      )}
    </>
  );
}

