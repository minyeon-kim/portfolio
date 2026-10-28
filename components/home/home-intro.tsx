"use client";

import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { DevsignLoop } from "@/components/devsign-loop";
import { DevsignLive, prepareDevsignZoom } from "@/components/devsign-live";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { HeroObject } from "./hero-object";
import type { StageProject } from "./project-stage";

type Props = { projects: StageProject[]; onSelect: (index: number, from?: HTMLElement | null, prepared?: HTMLElement | null) => void };

// The landing stage, after metalab.com's home: one dark screen, no scroll.
// A glossy object (HeroObject) turns slowly behind everything. Left: the case
// picker as pills. With nothing (or About me) hovered the stage reads the
// positioning: the first half as the big statement bottom right, the second
// half as the paragraph bottom left. Hovering or focusing a project pill swaps
// the stage into that case's world (metalab.com): the whole backdrop becomes
// its surface (Devsign's dark canvas, Gemini's blue night) while the loop
// fades, its media sits in a large card at the top right (the Devsign browser
// window with the live prototype, or the Gemini phone on its surface), the
// role sits top centre, the name large at the left of centre and the problem
// line bottom right. About me shows the name as the statement over the whole
// positioning line, on the plain stage.
export function HomeIntro({ projects, onSelect }: Props) {
  const t = useStrings();
  const locale = useLocale();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [recent, setRecent] = useState<{ name: string; text: string } | null>(null);
  const choices = [...projects, { slug: "about", name: t.aboutMe }];
  const shown = projects.find((p) => p.slug === hover) ?? null;
  const about = hover === "about";
  // The copy that replaces the positioning: a case's name and problem, or the
  // name and the whole positioning line for About me. Kept while it fades out.
  const next = shown ? { name: shown.name, text: shown.problem } : about ? { name: site.name, text: t.positioning } : null;
  if (next && (next.name !== recent?.name)) setRecent(next);
  // The hovered project's world: the whole stage takes its surface and its
  // media sits in a large card; its role, name and problem are laid out
  // across the stage (metalab.com). Kept while it fades out.
  const [recentProject, setRecentProject] = useState<StageProject | null>(null);
  if (shown && shown !== recentProject) setRecentProject(shown);
  // The live Devsign prototype starts loading the first time its pill is
  // hovered, so it is ready by the click.
  const [live, setLive] = useState(false);
  if (hover === "workflow-app" && !live) setLive(true);
  // The full-screen copy for the zoom is built at the same moment and removed
  // with the stage if it was never used.
  const zoomLayer = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!live || zoomLayer.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    zoomLayer.current = prepareDevsignZoom(locale);
  }, [live, locale]);
  useEffect(() => () => { if (zoomLayer.current?.dataset.prepared) zoomLayer.current.remove(); zoomLayer.current = null; }, []);

  const open = (slug: string) => {
    if (slug === "about") {
      revealNextProject(
        () => router.push(localize("/about/", locale), { scroll: false }),
        () => Boolean(document.querySelector("main [data-about-page]")),
      );
      return;
    }
    const index = projects.findIndex((p) => p.slug === slug);
    // The raised device is what grows into the case page; without one (touch,
    // keyboard before hover settled) the page just rises in.
    const device = document.querySelector<HTMLElement>(`.home-device[data-project="${slug}"][data-active] > *`);
    if (index >= 0) onSelect(index, device, slug === "workflow-app" ? zoomLayer.current : null);
  };

  return (
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px]" data-world={shown?.slug}>
      <div className="home-backdrop" data-project={shown?.slug} aria-hidden="true">
        <div className="intro-ambient"><span className="intro-ambient-blue" /><span className="intro-ambient-violet" /><span className="intro-ambient-pearl" /></div>
        <HeroObject className="home-object" variant={shown?.slug ?? "default"} />
        {projects.map((p) => <div key={p.slug} className="home-world" data-project={p.slug} data-active={shown?.slug === p.slug || undefined} />)}
        {projects.map((p) => (
          <div key={p.slug} className="home-device" data-project={p.slug} data-active={shown?.slug === p.slug || undefined}>
            {p.slug === "workflow-app"
              ? <div className="home-device-window"><div className="devsign-hero-chrome" aria-hidden="true"><span /><span /><span /><i /></div>{live ? <DevsignLive alt="" /> : <DevsignLoop alt="" />}</div>
              : p.slug === "gemini-privacy"
                ? <div className="home-device-phone"><GeminiDevice><GeminiPhone alt="" /></GeminiDevice></div>
                : null}
          </div>
        ))}
      </div>
      <div className="intro-surface home-grid">
        <nav className="home-picks" aria-label={t.projects}>
          <ol>
            {choices.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className="press home-pick"
                  data-slug={c.slug}
                  data-active={hover === c.slug || undefined}
                  onMouseEnter={() => setHover(c.slug)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c.slug)}
                  onBlur={() => setHover(null)}
                  onClick={() => open(c.slug)}
                >
                  {c.slug !== "about" && <span className="home-pick-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
                  {c.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="home-note" data-swap={next ? "" : undefined}>
          <p className="home-note-default">{t.heroParagraph}</p>
          <p className="home-note-project" aria-hidden={!next}>{recent?.text}</p>
        </div>
        <div className="home-tagline-wrap" data-swap={next ? "" : undefined}>
          <ScrambleHeadline className="home-tagline home-tagline-default" text={t.heroLine} emphasis={t.heroEmphasis} />
          <p className="home-tagline home-tagline-project" aria-hidden={!next}>{recent?.name}</p>
        </div>
        {recentProject?.role && <p className="home-world-role" data-on={shown ? "" : undefined} aria-hidden={!shown}>{recentProject.role}</p>}
        <p className="home-world-name" data-on={shown ? "" : undefined} aria-hidden={!shown}>{recentProject?.name}</p>
        <p className="home-world-problem" data-on={shown ? "" : undefined} aria-hidden={!shown}>{recentProject?.problem}</p>
      </div>
    </section>
  );
}
