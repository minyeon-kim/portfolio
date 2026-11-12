"use client";

import Link from "next/link";
import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site, withBase } from "@/lib/site";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { COVER_SCENES } from "@/lib/cover-scenes";
import { HeroShot } from "@/components/hero-shot";
import { enterAbout, portraitBox } from "@/lib/about-entrance";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { Emphasis } from "@/components/emphasis";
import { HeroObject } from "./hero-object";
import type { AboutWorld, StageProject } from "./project-stage";

type Props = { projects: StageProject[]; about?: AboutWorld; onSelect: (index: number, from?: HTMLElement | null) => void };

const STACKED = "(max-width: 63.99rem)";
const subscribeStacked = (onChange: () => void) => {
  const query = window.matchMedia(STACKED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// The landing stage, after metalab.com's home: one dark screen, no scroll.
// A glossy object (HeroObject) turns slowly behind everything. Left: the case
// picker as pills. With nothing (or About me) hovered the stage reads the
// positioning: the first half as the big statement bottom right, the second
// half as the paragraph bottom left. Hovering or focusing a project pill swaps
// the stage into that case's world (metalab.com): the whole backdrop becomes
// its surface (Devsign's dark canvas, Gemini's blue night) while the loop
// fades, its media sits in a large card at the top right (the Devsign browser
// window with the live prototype, or the Gemini phone on its surface), the
// name large and the problem line set apart. Each world has its own
// composition (CSS by data-world): Devsign like metalab.com's Midjourney state,
// Gemini like The Atlantic (portrait card at the bottom right), About (name bottom centre, no
// card: the site's own loop stays as the image, the headline is the statement
// with "End-to-end" set apart).
export function HomeIntro({ projects, about: aboutCopy, onSelect }: Props) {
  const t = useStrings();
  const locale = useLocale();
  const router = useRouter();
  const [hover, setHoverNow] = useState<string | null>(null);
  // The picked case's world stays as it is while its device grows over it: the
  // click blurs the pill and the pointer stops reaching it, which would clear it.
  const setHover = (slug: string | null) => {
    if (!document.documentElement.hasAttribute("data-project-navigation")) setHoverNow(slug);
  };
  const [recent, setRecent] = useState<{ name: string; text: string } | null>(null);
  // Only the projects: About is a text link above them, not a pick with a world.
  const choices: { slug: string; name: string; caption?: string }[] = projects;
  const shown = projects.find((p) => p.slug === hover) ?? null;
  const about = hover === "about";
  // The copy that replaces the positioning: a case's name and problem, or the
  // name and the whole positioning line for About me. Kept while it fades out.
  const next = shown ? { name: shown.name, text: shown.hook ?? shown.problem } : about ? { name: site.name, text: t.positioning } : null;
  if (next && (next.name !== recent?.name)) setRecent(next);
  // The hovered pill's world: the whole stage takes its surface and its media
  // (or, for About, a card of facts) sits in a large card; a role line, the
  // name and a paragraph are laid out across the stage, each world in its own
  // composition (metalab.com's per-project layouts). Kept while it fades out.
  type World = { slug: string; role?: string; emphasis?: string; name: string; text: string };
  const world: World | null = shown
    ? { slug: shown.slug, name: shown.name, text: shown.hook ?? shown.problem }
    : about && aboutCopy
      ? { slug: "about", role: aboutCopy.headline, emphasis: aboutCopy.emphasis, name: site.name, text: aboutCopy.bio }
      : null;
  // The copy changes in two beats (metalab.com): the current world's lines
  // leave (120ms) before the next world's lines arrive, staggered. `displayed`
  // trails `world` by that beat; while they differ the lines are hidden.
  const [displayed, setDisplayed] = useState<World | null>(null);
  const worldRef = useRef(world);
  useEffect(() => { worldRef.current = world; });
  const worldSlug = world?.slug ?? null, displayedSlug = displayed?.slug ?? null;
  useEffect(() => {
    if (worldSlug === displayedSlug) return;
    const timer = setTimeout(() => setDisplayed(worldRef.current), 120);
    return () => clearTimeout(timer);
  }, [worldSlug, displayedSlug]);
  const copyOn = world !== null && displayed !== null && world.slug === displayed.slug;
  // The way from a pill to its card crosses empty stage, so the world stays
  // while the pointer is inside the box around the pill and the card (and it
  // never drops under a pill that has keyboard focus). The card is then a way in.
  useEffect(() => {
    if (!hover) return;
    let timer: number | undefined;
    const release = () => { timer ??= window.setTimeout(() => setHover(null), 160); };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || document.activeElement?.matches(".home-pick:focus-visible, .home-about:focus-visible")) return;
      const parts = [`.home-picks [data-slug="${hover}"]`, `.home-device[data-project="${hover}"]`]
        .map((selector) => document.querySelector(selector)?.getBoundingClientRect())
        .filter((box): box is DOMRect => Boolean(box?.width));
      const inside = event.clientX >= Math.min(...parts.map((b) => b.left)) && event.clientX <= Math.max(...parts.map((b) => b.right))
        && event.clientY >= Math.min(...parts.map((b) => b.top)) && event.clientY <= Math.max(...parts.map((b) => b.bottom));
      // Over any pill the world stays until the pill's own switch takes over.
      const onPick = event.target instanceof Element && event.target.closest(".home-pick, .home-about");
      if (inside || onPick) { window.clearTimeout(timer); timer = undefined; } else release();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", release);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", release);
    };
  }, [hover]);
  // The way to a card can cross the other pill, so a switch between worlds waits
  // a moment; passing over a pill on the way doesn't swap the card away.
  const switching = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(switching.current), []);
  const enterPick = (slug: string) => {
    window.clearTimeout(switching.current);
    if (hover) switching.current = window.setTimeout(() => setHover(slug), 140);
    else setHover(slug);
  };
  // The About link has a world like the cases: hovering or focusing it lays the
  // stage out with the dust, the portrait as a card and the name and bio in
  // large type. Clicking (desktop, motion allowed) opens the page from that card:
  // the photo grows from the card into its place in the About opener
  // (lib/about-entrance.ts). Otherwise it is an ordinary link.
  // A case's card shows on hover or focus. Below 64rem there is no hover, and
  // the layout keeps room for a card, so the first case's shows from the start.
  const stacked = useSyncExternalStore(subscribeStacked, () => window.matchMedia(STACKED).matches, () => false);
  const previewed = shown ?? (stacked && hover !== "about" ? projects[0] : null);
  useEffect(() => {
    const src = withBase("/images/about/hero-tall.webp");
    router.prefetch(localize("/about/", locale));
    const aboutLink = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLAnchorElement>(".home-about") ?? null;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = aboutLink(event.target) ?? (event.target as Element | null)?.closest?.<HTMLElement>('.home-device[data-project="about"]');
      if (!link || document.documentElement.hasAttribute("data-project-navigation")) return;
      if (!window.matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)").matches) return;
      const card = document.querySelector<HTMLElement>('.home-device[data-project="about"][data-active] img');
      event.preventDefault();
      event.stopPropagation();
      const from = card?.getBoundingClientRect();
      enterAbout(portraitBox(), src, () => router.push(localize("/about/", locale), { scroll: false }), () => Boolean(document.querySelector<HTMLImageElement>("main [data-about-page] .about-hero-photo img")?.complete),
        from ? { left: from.left, top: from.top, width: from.width, height: from.height } : undefined);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [locale, router]);
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
    if (index >= 0) onSelect(index, device);
  };

  return (
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px]" data-world={world?.slug} >
      <div className="home-backdrop" data-project={world?.slug} aria-hidden="true">
        <div className="intro-ambient"><span className="intro-ambient-blue" /><span className="intro-ambient-violet" /><span className="intro-ambient-pearl" /></div>
        <HeroObject className="home-object" variant={hover === "about" ? "about" : shown?.slug ?? "default"} />
        {choices.map((c) => <div key={c.slug} className="home-world" data-project={c.slug} data-active={world?.slug === c.slug || undefined} />)}

        {projects.map((p) => (
          <Fragment key={p.slug}>
            {/* A pointer shortcut only: the backdrop is aria-hidden and the pills are the real controls. */}
            <div className="home-device" data-project={p.slug} data-active={previewed?.slug === p.slug || undefined} onClick={() => open(p.slug)}>
              {COVER_SCENES[p.slug] && (
                <HeroShot {...COVER_SCENES[p.slug]} src={withBase(p.hero?.film?.still ?? COVER_SCENES[p.slug].src)} alt="" crop={COVER_SCENES[p.slug].card} cropPhone={COVER_SCENES[p.slug].cardPhone} full={COVER_SCENES[p.slug].crop ?? [0, 0, COVER_SCENES[p.slug].width, COVER_SCENES[p.slug].height]} fullPhone={COVER_SCENES[p.slug].cropPhone}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.hero?.clip && <img className="dh-shot-poster" src={withBase(p.hero.clip.poster)} alt="" />}
                </HeroShot>
              )}
            </div>
          </Fragment>
        ))}
        {/* About's card: the portrait, a pointer shortcut like the case cards. */}
        <div className="home-device" data-project="about" data-active={world?.slug === "about" || undefined} onClick={() => open("about")}>
          <img src={withBase("/images/about/hero-tall.webp")} alt="" />
        </div>
      </div>
      <div className="intro-surface home-grid">
        <nav className="home-picks" aria-label={t.caseStudiesLabel}>
          <p className="home-picks-label">{t.caseStudiesLabel}</p>
          <ol>
            {choices.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className="press home-pick"
                  data-slug={c.slug}
                  data-active={hover === c.slug || undefined}
                  onMouseEnter={() => enterPick(c.slug)}
                  onMouseLeave={(event) => { if (!(event.relatedTarget instanceof Element && event.relatedTarget.closest(".home-pick"))) window.clearTimeout(switching.current); }}
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
        <div className="home-tagline-wrap" lang="en" data-swap={next ? "" : undefined}>
          <ScrambleHeadline className="home-tagline home-tagline-default" text={t.heroLine} emphasis={t.heroEmphasis} />
          <p className="home-tagline home-tagline-project" aria-hidden={!next}>{recent?.name}</p>
        </div>
        {displayed?.role && <p className={`home-world-role${displayed.emphasis ? " has-emphasis" : ""}`} data-on={copyOn || undefined} aria-hidden={!copyOn}><Emphasis text={displayed.role} phrase={displayed.emphasis} /></p>}
        <p className="home-world-name" data-on={copyOn || undefined} aria-hidden={!copyOn}>{displayed?.name.split(/(?<=^Gemini) /).map((line) => <span key={line}>{line}{" "}</span>)}</p>
        <p className="home-world-problem" data-on={copyOn || undefined} aria-hidden={!copyOn}>{displayed?.text}</p>
      </div>
    </section>
  );
}
