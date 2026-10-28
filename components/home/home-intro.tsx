"use client";

import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { DevsignLoop } from "@/components/devsign-loop";
import { prepareDevsignZoom } from "@/components/devsign-live";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { HeroObject } from "./hero-object";
import type { AboutWorld, StageProject } from "./project-stage";

type Props = { projects: StageProject[]; about?: AboutWorld; onSelect: (index: number, from?: HTMLElement | null, prepared?: HTMLElement | null) => void };

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
// line bottom right. Each world has its own composition (CSS by data-world):
// Devsign like metalab.com's Uber state, Gemini like Robinhood (portrait card
// cropped at the bottom right), About like Midjourney (name bottom centre, a
// no card: the site's own loop stays as the image, the three principles sit
// under the headline).
export function HomeIntro({ projects, about: aboutCopy, onSelect }: Props) {
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
  // The hovered pill's world: the whole stage takes its surface and its media
  // (or, for About, a card of facts) sits in a large card; a role line, the
  // name and a paragraph are laid out across the stage, each world in its own
  // composition (metalab.com's per-project layouts). Kept while it fades out.
  type World = { slug: string; role?: string; name: string; text: string };
  const world: World | null = shown
    ? { slug: shown.slug, role: shown.role, name: shown.name, text: shown.problem }
    : about && aboutCopy
      ? { slug: "about", role: aboutCopy.headline, name: site.name, text: aboutCopy.bio }
      : null;
  // The copy changes in two beats (metalab.com): the current world's lines
  // leave (220ms) before the next world's lines arrive, staggered. `displayed`
  // trails `world` by that beat; while they differ the lines are hidden.
  const [displayed, setDisplayed] = useState<World | null>(null);
  const worldRef = useRef(world);
  useEffect(() => { worldRef.current = world; });
  const worldSlug = world?.slug ?? null, displayedSlug = displayed?.slug ?? null;
  useEffect(() => {
    if (worldSlug === displayedSlug) return;
    const timer = setTimeout(() => setDisplayed(worldRef.current), 220);
    return () => clearTimeout(timer);
  }, [worldSlug, displayedSlug]);
  const copyOn = world !== null && displayed !== null && world.slug === displayed.slug;
  // The first hover of the Devsign pill builds the hidden full-screen
  // prototype for the zoom, so it is loaded by the click; the small card keeps
  // the image loop (one live frame at a time keeps the stage smooth). It is
  // removed with the stage if it was never used.
  const [live, setLive] = useState(false);
  if (hover === "workflow-app" && !live) setLive(true);
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
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px]" data-world={world?.slug}>
      <div className="home-backdrop" data-project={world?.slug} aria-hidden="true">
        <div className="intro-ambient"><span className="intro-ambient-blue" /><span className="intro-ambient-violet" /><span className="intro-ambient-pearl" /></div>
        <HeroObject className="home-object" variant={shown?.slug ?? "default"} active={!world || world.slug === "about"} />
        {choices.map((c) => <div key={c.slug} className="home-world" data-project={c.slug} data-active={world?.slug === c.slug || undefined} />)}

        {projects.map((p) => (
          <div key={p.slug} className="home-device" data-project={p.slug} data-active={shown?.slug === p.slug || undefined}>
            {p.slug === "workflow-app"
              ? <div className="home-device-window"><div className="devsign-hero-chrome" aria-hidden="true"><span /><span /><span /><i /></div><DevsignLoop alt="" /></div>
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
        {displayed?.role && <p className="home-world-role" data-on={copyOn || undefined} aria-hidden={!copyOn}>{displayed.role}</p>}
        <p className="home-world-name" data-on={copyOn || undefined} aria-hidden={!copyOn}>{displayed?.name}</p>
        <p className="home-world-problem" data-on={copyOn || undefined} aria-hidden={!copyOn}>{displayed?.text}</p>
        {displayed?.slug === "about" && aboutCopy && (
          <ol className="home-world-list" data-on={copyOn || undefined} aria-hidden={!copyOn}>
            {aboutCopy.principles.map((line, i) => <li key={line}><span>{String(i + 1).padStart(2, "0")}</span>{line}</li>)}
          </ol>
        )}
      </div>
    </section>
  );
}
