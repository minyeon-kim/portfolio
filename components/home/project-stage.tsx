"use client";

import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { ProjectTitle } from "@/components/project-title";
import { HomeIntro } from "./home-intro";
import { setUi, useUi } from "@/lib/ui-store";
import { revealNextProject } from "@/lib/project-transition";
import { filmOf } from "@/lib/film";
import { Segmented } from "./segmented";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { DevsignLoop } from "@/components/devsign-loop";
import { DevsignHero, type DevsignHeroData } from "@/components/devsign-hero";
import { site, withBase } from "@/lib/site";
import { localize } from "@/lib/i18n";

export type StageProject = {
  slug: string;
  name: string;
  title: string;
  caption?: string; // the home card's caption line
  hook?: string; // the problem in one sentence, for the hover
  problem: string;
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
  hero?: DevsignHeroData; // Figma-style opener instead of the title and growing cover
};

export type AboutWorld = { headline: string; emphasis: string; bio: string };

type Props = { projects: StageProject[]; about?: AboutWorld };

// Project selection opens an editorial heading and full-width cover.
export function ProjectStage({ projects, about }: Props) {
  const t = useStrings();
  const locale = useLocale();
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
  // Opening a case from the landing adds a history entry at the case's own URL,
  // so a refresh or a shared link lands on that case (its direct page) and Back
  // returns to the landing; switching between cases only replaces it. Back and
  // Forward then follow that entry.
  useEffect(() => {
    const pop = () => {
      const slug = (window.history.state as { homeCase?: string } | null)?.homeCase;
      // In-page links (stage nav) fire popstate too, on an entry with no
      // state: that is scrolling inside the case, not leaving it.
      if (!slug && window.location.hash) return;
      const index = slug ? projects.findIndex((x) => x.slug === slug) : -1;
      setUi({ activeCase: index >= 0 ? index : null, menuOpen: false });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [projects]);
  // The history entry follows the open case. Internal router fields are left out
  // of the entry on purpose: without them Next.js syncs usePathname with the URL.
  // Leaving the case another way (the name in the header, overscroll at the top)
  // steps back over its entry too, so one Back press never does nothing.
  const previous = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    const entry = (window.history.state as { homeCase?: string } | null)?.homeCase;
    const was = previous.current;
    previous.current = active;
    // Arriving here (Back from another page, or a stale pick): the entry decides.
    if (was === undefined) {
      const index = entry ? projects.findIndex((x) => x.slug === entry) : -1;
      const wanted = index >= 0 ? index : null;
      previous.current = wanted;
      if (wanted !== active) setUi({ activeCase: wanted });
      return;
    }
    if (active === null) {
      if (was !== null && entry) window.history.back();
      return;
    }
    const slug = projects[active].slug;
    const url = withBase(localize(`/work/${slug}/`, locale));
    if (was === null && entry !== slug) window.history.pushState({ homeCase: slug }, "", url);
    else if (window.location.pathname !== url) window.history.replaceState({ homeCase: slug }, "", url);
  }, [active, locale, projects]);
  // Next.js doesn't retitle the tab for these entries (other pages set their own).
  useEffect(() => {
    document.title = active === null ? `${site.name} — Product Designer` : `${projects[active].title} — ${site.name}`;
  }, [active, projects]);
  const select = (index: number, from?: HTMLElement | null) => {
    const project = projects[index];
    revealNextProject(
      () => setUi({ activeCase: index }),
      () => Boolean(document.querySelector(`main [data-stage-index="${index}"]`)),
      from && project?.hero ? { from, to: "main .devsign-hero-media", project: project.slug, film: filmOf(project.hero.film) } : undefined,
    );
  };
  const p = active !== null ? projects[active] : null;

  return (
    <>
      {active === null && <HomeIntro projects={projects} about={about} onSelect={select} />}
      {p && (
      <section id="work" aria-label={`${p.name}, selected case`} className={p.hero ? "project-selected full-bleed md:-mt-[64px]" : "project-selected stage-pin full-bleed md:-mt-[64px]"}>
        <div key={p.slug} id="stage-panel" data-stage-index={active} className={p.hero ? "selected-stage selected-stage-hero" : "selected-stage"} data-canvas={(p.slug === "devsign" && !p.hero) || undefined} data-gemini={p.slug === "gemini-privacy" || undefined}>
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
              : p.slug === "devsign"
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

