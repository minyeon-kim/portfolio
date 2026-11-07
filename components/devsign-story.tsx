"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type PairSide = Shot & { clip: { src: string; poster: string } };
type Change = { title: string; before: string; after: string; clip: { src: string; poster: string; cut: number } };

// Boards too dense to read at column width stay still; the frame opens the full image.
export function OpenFrame({ children, href }: { children: React.ReactNode; href: string }) {
  const locale = useLocale();
  return (
    <a className="dv-open-frame" href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="dv-open-hint" aria-hidden="true">{locale === "ko" ? "크게 보기 ↗" : "View full size ↗"}</span>
    </a>
  );
}

// One change as one recording: the old workspace, then the new one, zooming in on
// what changed. The As-is / To-be lines follow the clip and jump to their part. It
// plays only while current and half on screen; with reduced motion, or if the
// browser refuses autoplay, it shows its controls instead.
function IterationStep({ change, index, total, pinned, active, labels, onEnd }: { change: Change; index: number; total: number; pinned: boolean; active: boolean; labels: { asIs: string; toBe: string }; onEnd: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [still, setStill] = useState(false);
  const [refused, setRefused] = useState(false);
  const [phase, setPhase] = useState<"a" | "b">("a");
  const wanted = (!pinned || active) && onScreen && !still;
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const nearby = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearby.disconnect(); } }, { rootMargin: "100% 0px" });
    const half = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.5 });
    nearby.observe(el);
    half.observe(el);
    return () => { nearby.disconnect(); half.disconnect(); };
  }, []);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (!wanted) { el.pause(); return; }
    // A clip that takes over starts from its As-is part.
    if (pinned) el.currentTime = 0;
    el.play().then(() => setRefused(false)).catch(() => setRefused(true));
  }, [wanted, pinned, near]);
  const seek = (to: "a" | "b") => {
    const el = video.current;
    if (!el) return;
    el.currentTime = to === "a" ? 0 : change.clip.cut;
    setPhase(to);
    if (wanted) el.play().catch(() => {});
  };
  const sides = [
    { key: "a", tag: labels.asIs, line: change.before },
    { key: "b", tag: labels.toBe, line: change.after },
  ] as const;
  return (
    <li className="dv-iter-step" data-on={active || undefined}>
      <h4 className="dv-iter-name"><b>{index + 1} / {total}</b>{change.title}</h4>
      <div className="dv-iter-clip">
        <video ref={video} src={near ? withBase(change.clip.src) : undefined} poster={withBase(change.clip.poster)} muted loop playsInline preload={near ? "auto" : "none"} controls={still || refused} onEnded={onEnd} width={1600} height={1000} aria-label={`${change.title}. ${labels.asIs}: ${change.before} ${labels.toBe}: ${change.after}`}
          onTimeUpdate={(e) => setPhase(e.currentTarget.currentTime >= change.clip.cut ? "b" : "a")} />
      </div>
      <div className="dv-iter-sides">
        {sides.map(({ key, tag, line }) => (
          <button key={key} type="button" className="dv-iter-switch" data-side={key} aria-pressed={phase === key} onClick={() => seek(key)}>
            <span>{tag}</span>{line}
          </button>
        ))}
      </div>
    </li>
  );
}

// The holding card: it stays on screen (CSS sticky) and one step at a time crossfades inside it
// as the page scrolls. Native scroll only. On phones and with reduced motion (CSS) each step is
// its own card. A step mark scrolls to the middle of its step, and shows it at once.
export const REELS_PIN = "(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const HELD_TAIL = 0.5;
const TALL_PIN = "(min-width: 64rem) and (min-height: 820px) and (prefers-reduced-motion: no-preference)";

export function useHeldSteps(count: number, pinQuery: string = REELS_PIN) {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // The tallest the stage has been, so a step with a shorter stage doesn't shift it on screen.
  const tallest = useRef(0);
  const measure = (el: HTMLElement) => {
    const now = (el.firstElementChild as HTMLElement).offsetHeight;
    tallest.current = Math.max(tallest.current, now);
    const stage = tallest.current;
    // Centred on the screen, below the header when the screen is short.
    return { top: Math.max(76, Math.round((window.innerHeight - stage) / 2) + 20), travel: el.offsetHeight - now };
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    let scrollStep = -1;
    const read = () => {
      frame = 0;
      const { top, travel } = measure(el);
      const moved = Math.max(0, top - el.getBoundingClientRect().top);
      el.style.setProperty("--stage-top", `${top}px`);
      // Equal steps, and the last one gets half a step more before the stage lets go, so its
      // content can be read before the page moves on (owner). The CSS track is (n + 0.5) steps.
      const unit = travel / (count + HELD_TAIL);
      // Only a scroll into another step takes over from a step that moved on by itself.
      const step = travel > 0 ? Math.min(count - 1, Math.floor(moved / unit)) : 0;
      if (step !== scrollStep) { scrollStep = step; setActive(step); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    const query = window.matchMedia(pinQuery);
    const sync = () => { tallest.current = 0; setPinned(query.matches); };
    sync();
    read();
    query.addEventListener("change", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, pinQuery]);
  const go = (i: number) => {
    const el = root.current;
    if (!el) return;
    setActive(i);
    const { top, travel } = measure(el);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - top + (i + 0.5) * (travel / (count + HELD_TAIL)), behavior: "smooth" });
  };
  return { root, active, setActive, pinned, go };
}

// A short list that reveals one row per step: the heading and list hold on screen and each scroll
// step brings in the next row (owner). Elsewhere the list shows with FlowPlay as before.
export function HeldFlow({ count, children }: { count: number; children: React.ReactNode }) {
  const held = useHeldSteps(count);
  return (
    <div ref={held.root} className="dv-held-track dv-held-flow" data-pinned={held.pinned || undefined} style={{ "--n": count, "--held-step": held.active } as CSSProperties}>
      <div className="dv-held-flow-stage">{children}</div>
    </div>
  );
}

// Word tabs over a holding card: they say what can be picked before the card is read, and jump
// to that step of the scroll (the chart cards use the same tabs).
function StepTabs({ names, active, go, label }: { names: string[]; active: number; go: (i: number) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="dv-held-tabs">
      {names.map((name, i) => <button key={name} type="button" className="press" aria-pressed={i === active} onClick={() => go(i)}><span>{name}</span></button>)}
    </div>
  );
}

// A clip that ends hands over to the next, round to the first, without moving the page;
// scrolling into another step takes over again.
export function IterationCompare({ changes, labels }: { changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const { root, active, setActive, pinned, go } = useHeldSteps(changes.length);
  const locale = useLocale();
  return (
    <div ref={root} className="dv-iter" style={{ "--n": changes.length } as CSSProperties}>
      <div className="dv-iter-stage">
        {pinned && <StepTabs names={changes.map((c) => c.title)} active={active} go={go} label={locale === "ko" ? "바꾼 점" : "Changes"} />}
        <div className="dv-held-plate">
          <ol className="dv-iter-steps">
            {changes.map((c, i) => <IterationStep key={c.title} change={c} index={i} total={changes.length} pinned={pinned} active={i === active} labels={labels} onEnd={() => {}} />)}
          </ol>
        </div>
      </div>
    </div>
  );
}

// The same holding card for still phone screens: the whole screen on the case's colour, and
// what changed beside it. The As-is line has no screen of its own, so it isn't a switch.
type ScreenChange = { title: string; before: string; after: string; src: string; alt?: string; width?: number; height?: number };
export function ScreenSteps({ changes, labels }: { changes: ScreenChange[]; labels: { asIs: string; toBe: string } }) {
  const { root, active, pinned, go } = useHeldSteps(changes.length);
  const locale = useLocale();
  return (
    <div ref={root} className="dv-iter dv-screens-held" style={{ "--n": changes.length } as CSSProperties}>
      <div className="dv-iter-stage">
        {pinned && <StepTabs names={changes.map((c) => c.title)} active={active} go={go} label={locale === "ko" ? "바꾼 점" : "Changes"} />}
        <div className="dv-held-plate">
        <ol className="dv-iter-steps">
          {changes.map((c, i) => (
            <li key={c.title} className="dv-iter-step" data-on={i === active || undefined}>
              <h4 className="dv-iter-name"><b>{i + 1} / {changes.length}</b>{c.title}</h4>
              <div className="dv-iter-clip"><Image src={withBase(c.src)} alt={c.alt ?? ""} width={c.width ?? 750} height={c.height ?? 1624} sizes="320px" loading="eager" /></div>
              <div className="dv-iter-sides">
                <p className="dv-screen-line"><span>{labels.asIs}</span>{c.before}</p>
                <p className="dv-screen-line" data-side="b"><span>{labels.toBe}</span>{c.after}</p>
              </div>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </div>
  );
}

type Area = [number, number, number, number];
type Candidate = { id: string; name: string; kind: string; pain: string; to: string; from: Area; relief: Area };
type CanvasArt = { src: string; width: number; height: number; painArea: Area; reliefArea: Area; alt: string };

// The canvas once, as one picture. Under it, in words, the key pains, what answers
// each and the feature it became. The other candidates are for screen readers.
export function CanvasZoom({ art, candidates, keyPairs, painLabel, reliefLabel, featureLabel, overviewLabel }: { art: CanvasArt; candidates: Candidate[]; keyPairs: string[]; painLabel: string; reliefLabel: string; featureLabel: string; overviewLabel: string }) {
  const rows = keyPairs.flatMap((id) => candidates.filter((c) => c.id === id));
  const others = candidates.filter((c) => !keyPairs.includes(c.id));
  return (
    <div className="dv-vpc">
      <div className="dv-vpc-view reveal">
        <OpenFrame href={withBase(art.src)}>
          <Image src={withBase(art.src)} alt={art.alt} width={art.width} height={art.height} sizes="(max-width: 767px) 100vw, 1200px" />
        </OpenFrame>
      </div>
      <HeldFlow count={rows.length}>
      <p className="dv-vpc-title reveal">{overviewLabel}</p>
      {/* One row per pair, read left to right like a comparison table (owner: three cards read
          top to bottom were awkward): the pain heard → the idea that answers it → the feature. */}
      <div className="dv-vpc-table reveal" role="table" aria-label={overviewLabel}>
        <div className="dv-vpc-head" role="row">
          <span role="columnheader">{painLabel}</span><span aria-hidden="true" /><span role="columnheader">{reliefLabel}</span><span aria-hidden="true" /><span role="columnheader">{featureLabel}</span>
        </div>
        {rows.map((c, i) => (
          <div key={c.id} className="dv-vpc-row" role="row" style={{ "--i": i } as CSSProperties}>
            <p role="cell" data-label={painLabel}>“{c.pain}”</p>
            <span className="dv-vpc-arrow" aria-hidden="true"><ArrowIcon size={20} /></span>
            <p role="cell" data-label={reliefLabel}>{c.name}</p>
            <span className="dv-vpc-arrow" aria-hidden="true"><ArrowIcon size={20} /></span>
            <b role="cell" data-label={featureLabel}>{c.to}</b>
          </div>
        ))}
      </div>
      </HeldFlow>
      <ul className="sr-only">
        {others.map((c) => <li key={c.id}>{c.name}: {c.pain} → {c.to}</li>)}
      </ul>
    </div>
  );
}

// A smaller iteration: As-is and To-be side by side as two cards, the same part of the screen at
// one shape, so the difference reads at a glance. Only To-be sits on the case's colour.
// Faster than real time, so the change from one screen to the other reads as one beat.
// As-is runs quicker than To-be (owner: the before was on screen too long): about 4.5s vs 5.6s.
const PAIR_RATE = [2.5, 1.6];

export function IterationPair({ before, after, labels }: { before: PairSide; after: PairSide; labels: { asIs: string; toBe: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [turn, setTurn] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [near, setNear] = useState(false);
  const [manual, setManual] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setManual(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const nearby = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearby.disconnect(); } }, { rootMargin: "100% 0px" });
    const half = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.4 });
    nearby.observe(el);
    half.observe(el);
    // The scroll picks whose turn it is (owner: scrolling on brings the next motion): As-is while
    // the pair rises into the lower half of the screen, To-be once its middle passes the middle.
    // Stacked on a phone, the card nearer the middle plays.
    let frame = 0;
    const read = () => {
      frame = 0;
      const cards = [...el.querySelectorAll<HTMLElement>(".dv-iter-card")].map((c) => c.getBoundingClientRect());
      if (cards.length < 2) return;
      const mid = window.innerHeight / 2;
      const next = Math.abs(cards[0].top - cards[1].top) < 12
        ? (cards[0].top + cards[0].height / 2 < mid + window.innerHeight * 0.08 ? 1 : 0)
        : (Math.abs(cards[1].top + cards[1].height / 2 - mid) < Math.abs(cards[0].top + cards[0].height / 2 - mid) ? 1 : 0);
      setTurn(next);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { nearby.disconnect(); half.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  // One plays at a time; the one whose turn it is loops until the scroll moves on.
  useEffect(() => {
    if (manual) return;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === turn && onScreen && near) { v.currentTime = 0; v.playbackRate = PAIR_RATE[i]; v.play().catch(() => setManual(true)); }
      else { v.pause(); if (v.currentTime) v.currentTime = 0; }
    });
  }, [turn, onScreen, near, manual]);
  const sides = [
    { key: "a", tag: labels.asIs, side: before },
    { key: "b", tag: labels.toBe, side: after },
  ] as const;
  return (
    <div ref={root} className="dv-iter-duo reveal">
      {sides.map(({ key, tag, side }, i) => (
        <figure key={key} className="dv-iter-card" data-side={key} data-on={(!manual && turn === i && onScreen) || undefined}>
          <div className="dv-iter-plate">
            <div className="dv-iter-view">
              <video ref={(el) => { videos.current[i] = el; }} src={near ? withBase(side.clip.src) : undefined} poster={withBase(side.clip.poster)} muted playsInline preload={near ? "auto" : "none"} controls={manual} width={1440} height={686} aria-label={`${side.alt ?? tag} ${side.text}`} onEnded={(e) => { if (i === turn) { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); } }} />
            </div>
            {key === "b" && <span className="dv-iter-arrow" aria-hidden="true"><ArrowIcon size={20} /></span>}
          </div>
          <figcaption><span>{tag}</span>{side.text}</figcaption>
        </figure>
      ))}
    </div>
  );
}

// One core feature: its one sentence and the real prototype clip. With reduced motion
// nothing autoplays and the video shows its controls. If the browser refuses to
// autoplay (iPhone Low Power Mode, a locked-down classroom PC), the clip shows its
// controls too and tries again on the next press or key, so it is never a dead image.
type Reel = { id: string; kicker: string; name: string; body: string; hook?: string; flow?: string; alt?: string; points: string[]; clip: { src: string; poster: string; marks: number[] }; solves?: React.ReactNode };
function FeatureReel({ reel, active, pinned, load }: { reel: Reel; active: boolean; pinned: boolean; load: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);
  const [refused, setRefused] = useState(false);
  const [near, setNear] = useState(false);
  const gate = useRef({ onScreen: false, wanted: true });
  const startClip = useRef(() => {});
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    // Start fetching a screen early, so a slow network doesn't show a still poster.
    const nearby = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); nearby.disconnect(); } }, { rootMargin: "100% 0px" });
    nearby.observe(el);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(motion.matches);
    if (motion.matches) return () => nearby.disconnect();
    el.playbackRate = PLAYBACK_RATE;
    const start = () => {
      if (!gate.current.onScreen || !gate.current.wanted) return;
      el.muted = true;
      el.play().catch((error: Error) => { if (error.name === "NotAllowedError") setRefused(true); });
    };
    startClip.current = start;
    // Coming back to the tab, or the first press, gets another try.
    const retry = () => { if (el.paused) start(); };
    const onVisible = () => { if (document.visibilityState === "visible") retry(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("keydown", retry);
    const onScreen = new IntersectionObserver(([entry]) => {
      gate.current.onScreen = entry.isIntersecting;
      if (entry.isIntersecting) start();
      else el.pause();
    }, { threshold: 0.5 });
    onScreen.observe(el);
    return () => {
      nearby.disconnect();
      onScreen.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
    };
  }, []);
  // Pinned, only the current clip plays, from its start when it takes over.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const wanted = !pinned || active;
    gate.current.wanted = wanted;
    if (!wanted) { el.pause(); return; }
    if (pinned) el.currentTime = 0;
    startClip.current();
  }, [active, pinned]);
  return (
    <li id={reel.id} className="dv-reel dv-link-target" data-on={active || undefined}>
      <div className="dv-reel-media">
        <video ref={video} src={withBase(reel.clip.src)} poster={withBase(reel.clip.poster)} muted loop playsInline preload={near && load ? "auto" : "none"} controls={still || refused} aria-label={reel.alt ?? reel.name} onPlaying={() => setRefused(false)} />
      </div>
      <div className="dv-reel-text">
        <p className="dv-reel-name"><b>{reel.kicker.split(" ")[0]}</b>{reel.name}<span>{reel.kicker.split(" ").slice(1).join(" ")}</span></p>
        <h4 className="dv-reel-line">{reel.body}</h4>
        {reel.solves && <p className="dv-reel-solves">{reel.solves}</p>}
      </div>
    </li>
  );
}

// Keep in step with the pinned rules at the end of globals.css.

// On desktop one card holds still on the screen: the clip on its colour at the left, the
// text at the right, and native scroll changes what's inside. The steps show where you are
// and jump there. Elsewhere each feature is its own card, clip above its text.
// Core features after Mobbin's section (owner's reference): the features as a list at the left,
// only the current one open (its sentence and what it solves, with a bar that fills as its clip
// plays), and one wide frame at the right playing that feature's clip. When a clip ends the next
// feature opens; pressing a name switches at once. Clips play only while the block is on screen;
// with reduced motion nothing plays by itself and the clip shows its controls.
// On a desktop with room and motion, the list and clip hold on screen while native scroll moves
// through the features (the held-track pattern); a clip loops while its feature is current.
// Elsewhere a clip that ends opens the next feature.
export function FeatureList({ reels }: { reels: Reel[] }) {
  const { root: track, active, setActive, pinned, go } = useHeldSteps(reels.length);
  const root = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const current = active;
  const [onScreen, setOnScreen] = useState(false);
  const [near, setNear] = useState(false);
  const [still, setStill] = useState(false);
  const [refused, setRefused] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const nearby = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearby.disconnect(); } }, { rootMargin: "100% 0px" });
    const seen = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.4 });
    nearby.observe(el);
    seen.observe(el);
    const retry = () => { const v = videos.current[current]; if (v && v.paused && !still) v.play().catch(() => {}); };
    window.addEventListener("pointerdown", retry, { passive: true });
    return () => { nearby.disconnect(); seen.disconnect(); window.removeEventListener("pointerdown", retry); };
  }, [current, still]);
  useEffect(() => {
    root.current?.style.setProperty("--fl-p", "0");
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === current && onScreen && !still) {
        v.muted = true;
        v.playbackRate = PLAYBACK_RATE;
        v.play().catch((error: Error) => { if (error.name === "NotAllowedError") setRefused(true); });
      } else {
        v.pause();
        if (i !== current && v.currentTime) v.currentTime = 0;
      }
    });
  }, [current, onScreen, still]);
  const pick = (i: number) => {
    const v = videos.current[i];
    if (v) v.currentTime = 0;
    if (pinned) go(i);
    else setActive(i);
  };
  return (
    <div ref={track} className="dv-held-track dv-flist-track dv-gap-40" style={{ "--n": reels.length } as CSSProperties}>
    <div ref={root} className="dv-flist">
      <ol className="dv-flist-items">
        {reels.map((reel, i) => (
          <li key={reel.id} id={reel.id} className="dv-link-target" data-on={i === current || undefined} data-t={i % 4}>
            <button type="button" aria-expanded={i === current} onClick={() => pick(i)}>
              <b>{reel.kicker.split(" ")[0]}</b>
              <span>{reel.name}{reel.hook && <small>{reel.hook}</small>}</span>
            </button>
            <div className="dv-flist-more">
              <div>
                {reel.solves && <p className="dv-flist-solves">{reel.solves}</p>}
              </div>
            </div>
            <i className="dv-flist-bar" aria-hidden="true"><i /></i>
          </li>
        ))}
      </ol>
      <div className="dv-flist-frame" data-tone={current % 4}>
        {[0, 1, 2, 3].map((t) => <i key={`tone-${t}`} className="dv-flist-tone" data-t={t} data-on={current % 4 === t || undefined} aria-hidden="true" />)}
        {reels.map((reel, i) => (
          <video
            key={reel.id}
            ref={(el) => { videos.current[i] = el; }}
            src={withBase(reel.clip.src)}
            poster={withBase(reel.clip.poster)}
            muted
            playsInline
            loop={pinned}
            preload={near && i <= current + 1 ? "auto" : "none"}
            controls={(still || refused) && i === current}
            data-on={i === current || undefined}
            aria-hidden={i !== current || undefined}
            aria-label={reel.alt ?? reel.name}
            onTimeUpdate={(e) => { if (i === current) root.current?.style.setProperty("--fl-p", String(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)); }}
            onPlaying={() => setRefused(false)}
            onEnded={() => { if (i === current && !pinned) pick((i + 1) % reels.length); }}
          />
        ))}
      </div>
    </div>
    </div>
  );
}

export function FeatureReels({ reels }: { reels: Reel[] }) {
  const locale = useLocale();
  const track = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [current, setCurrent] = useState(0);
  const travel = useRef({ top: 0, length: 0 });
  useEffect(() => {
    const query = window.matchMedia(REELS_PIN);
    const update = () => setPinned(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const box = track.current;
    const held = card.current;
    if (!pinned || !box || !held) { setCurrent(0); return; }
    let frame = 0;
    const read = () => {
      frame = 0;
      const { top, length } = travel.current;
      const progress = length > 0 ? Math.min(1, Math.max(0, (top - box.getBoundingClientRect().top) / length)) : 0;
      setCurrent(Math.min(reels.length - 1, Math.floor(progress * reels.length)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(read); };
    // Centred on the screen, below the header when the screen is short.
    const measure = () => {
      const top = Math.max(76, Math.round((window.innerHeight - held.offsetHeight) / 2) + 20);
      box.style.setProperty("--reel-top", `${top}px`);
      travel.current = { top, length: box.offsetHeight - held.offsetHeight };
      schedule();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(held);
    resize.observe(box);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      box.style.removeProperty("--reel-top");
    };
  }, [pinned, reels.length]);
  const go = (index: number) => {
    const box = track.current;
    if (!box) return;
    const { top, length } = travel.current;
    window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - top + ((index + 0.5) / reels.length) * length, behavior: "smooth" });
  };
  return (
    <div ref={track} className="dv-reels-track dv-gap-40" style={{ "--reels": reels.length } as CSSProperties}>
      <div ref={card} className="dv-reels-card">
        {pinned && <StepTabs names={reels.map((reel) => reel.name)} active={current} go={go} label={locale === "ko" ? "핵심 기능" : "Core features"} />}
        <div className="dv-held-plate">
          <ul className="dv-reels">
            {reels.map((reel, index) => <FeatureReel key={reel.id} reel={reel} active={index === current} pinned={pinned} load={!pinned || index <= current + 1} />)}
          </ul>
        </div>
      </div>
    </div>
  );
}

type UsabilityScore = { value: string; unit: string; ratio: number; target?: number; title: string; note: string; missed?: boolean };

const COUNT_MS = 1400;
const COUNT_STAGGER_MS = 160;

// Usability results as stacked rows, so the bars share one axis and the two SUS
// scores read against the same average: when on screen the numbers count up and
// the bars fill one after another, then the line saying what they meant lights
// up. The final values are in the markup, so no JS or reduced motion simply
// shows them.
type Problem = { title: string; body: string };

// Key problems as one list: the problem is what you read, one sentence explains it. Define stops
// at the problem; the feature answering each one is told in Deliver, under that feature.
export function ProblemPanels({ items, children }: { items: Problem[]; children?: React.ReactNode }) {
  return (
    <div className="dv-panels-wrap">
      <HeldFlow count={items.length}>
      {children}
      <ol className="dv-panels reveal">
        {items.map((item, i) => (
          <li key={item.title} className="dv-step-item" style={{ "--i": i } as CSSProperties}>
            <b className="dv-panel-num">{pad(i + 1)}</b>
            <div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
      </HeldFlow>
    </div>
  );
}

type SpecScreen = { id: string; tab: string; alt: string; src: string; rows: [string, string, string][]; pins: [number, number][]; purpose: string; accept: string[]; tokens: string[]; code: [string, string][] };
type SpecData = { shared: string; open: string; screens: SpecScreen[]; cols: { name: string; does: string; state: string }; labels: { elements: string; states: string; accept: string; dev: string; tokens: string; code: string; play: string; pause: string }; more?: string; moreHref?: string };

// `--ds-token` in the copy reads as code.
const tokenText = (text: string) => text.split(/(`[^`]+`)/).map((part, i) => part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part);

// How far the screen zooms in on one element; the shots are 2x, so it stays sharp.
const SPEC_ZOOM = 1.8;
const specZoom = (x: number, y: number) => {
  const at = (v: number) => Math.min(0, Math.max(100 - 100 * SPEC_ZOOM, 50 - v * SPEC_ZOOM));
  return { "--s": SPEC_ZOOM, transform: `translate(${at(x)}%, ${at(y)}%) scale(${SPEC_ZOOM})` } as CSSProperties;
};

// Long enough to read a step, whatever its length.
const specDwell = (text: string) => Math.min(8000, Math.max(4000, text.length * 55));

// The handoff spec plays by itself: the screen on its colour zooms to one element at a time with
// its behavior and states beside it, then what "done" means and the tokens and code with the whole
// screen back, then the next screen, round to the first. The bars show where it is; a bar, a tab or
// a pin jumps there, and nothing has to be pressed. It runs while 40% of it is on screen and holds
// while the pointer is on the words, on keyboard focus, or on pause. `auto={false}` starts on pause
// (the spec page is for looking things up). Reduced motion never plays; phones list all of it.
// A number that counts up once when it comes into view ("100+" keeps its suffix). Static with
// reduced motion; the final value is in the markup.
export function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || !match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, pre, num, post] = match;
    const end = Number(num);
    let frame = 0;
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(`${pre}${Math.round(end * eased)}${t === 1 ? post : ""}`);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      setShown(`${pre}0`);
      frame = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    seen.observe(el);
    return () => { seen.disconnect(); cancelAnimationFrame(frame); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <strong ref={ref} className="dv-count" aria-label={value}><span aria-hidden="true">{shown}</span></strong>;
}

type AffinityGroup = [string, string, number];

// Affinity mapping as motion (owner: show the grouping, not a photo of it): sticky notes start mixed
// across the frame and, when it comes into view, travel into their theme's column, each column named
// at its top. The notes carry no text: the motion shows the method, the real board is linked. Plays
// once; Replay mixes them again. Reduced motion shows the grouped state.
export function AffinityMotion({ groups, replay, board }: { groups: AffinityGroup[]; replay: string; board: { href: string; label: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0 });
  const [grouped, setGrouped] = useState(false);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduced);
    if (reduced) setGrouped(true);
    const resize = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width }));
    resize.observe(el);
    let timer = 0;
    const seen = new IntersectionObserver(([e]) => { if (e.isIntersecting) { timer = window.setTimeout(() => setGrouped(true), 500); seen.disconnect(); } }, { threshold: 0.15 });
    if (!reduced) seen.observe(el);
    return () => { resize.disconnect(); seen.disconnect(); window.clearTimeout(timer); };
  }, []);
  const notes = groups.flatMap(([, color, n], g) => Array.from({ length: n }, (_, k) => ({ g, k, color })));
  // Layout: columns of themes, two notes per row inside a column.
  const w = size.w || 1200;
  const cols = w >= 900 ? groups.length : w >= 560 ? 4 : 2;
  const gap = w >= 900 ? 16 : 10;
  const colW = (w - gap * (cols - 1)) / cols;
  const noteW = (colW - 6) / 2;
  const noteH = noteW * 0.8;
  const labelH = w >= 900 ? 60 : 52;
  const rowsPer = groups.map(([, , n]) => Math.ceil(n / 2));
  const bandRows = Array.from({ length: Math.ceil(groups.length / cols) }, (_, r) => Math.max(...rowsPer.slice(r * cols, r * cols + cols)));
  const bandTop = bandRows.map((_, r) => bandRows.slice(0, r).reduce((sum, rows) => sum + labelH + rows * (noteH + 6) + 32, 0));
  const height = bandTop[bandTop.length - 1] + labelH + bandRows[bandRows.length - 1] * (noteH + 6);
  const rand = (seed: number) => { const x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); };
  const place = (g: number, k: number, i: number) => {
    if (!grouped) return { x: rand(i + 1) * (w - noteW), y: rand(i + 77) * (height - noteH), r: (rand(i + 9) - 0.5) * 24 };
    const c = g % cols;
    const band = Math.floor(g / cols);
    return { x: c * (colW + gap) + (k % 2) * (noteW + 6), y: bandTop[band] + labelH + Math.floor(k / 2) * (noteH + 6), r: 0 };
  };
  return (
    <div className="dv-aff-motion dv-gap-40">
      <div ref={root} className="dv-aff-stage" data-grouped={grouped || undefined} style={{ height }} aria-hidden="true">
        {groups.map(([name, color], g) => (
          <p key={name} className="dv-aff-label" style={{ left: (g % cols) * (colW + gap), top: bandTop[Math.floor(g / cols)], width: colW, "--c": color } as CSSProperties}>{name}</p>
        ))}
        {notes.map(({ g, k, color }, i) => {
          const at = place(g, k, i);
          return <i key={i} className="dv-aff-note" style={{ width: noteW, height: noteH, background: color, transform: `translate(${at.x}px, ${at.y}px) rotate(${at.r}deg)`, transitionDelay: still ? "0ms" : `${Math.round(rand(i + 31) * 500)}ms` } as CSSProperties} />;
        })}
      </div>
      <ul className="sr-only">{groups.map(([name]) => <li key={name}>{name}</li>)}</ul>
      <p className="dv-aff-foot">
        {!still && <button type="button" className="press" onClick={() => { setGrouped(false); window.setTimeout(() => setGrouped(true), 700); }}>{replay}</button>}
        <a className="link" href={board.href} target="_blank" rel="noreferrer">{board.label}</a>
      </p>
    </div>
  );
}

type WallData = { types: [string, string, string][]; steps: string[]; aside: string; themes: [string, number, number?][]; notes: [string, string, string][][]; allLabel?: string };

// Affinity mapping as it happened (owner): all 201 interview notes start as small stickies spread
// over the frame; then the 18 that carry the finding grow into readable notes sorted by type of
// statement while the rest fade back into a small mosaic; then everything moves into the seven themes,
// and the themes gather into the four problems. Only the key notes stay readable; the mosaic under
// each column shows how much was said. It plays once when it comes into view and stays on the last
// step. Reduced motion shows the last step.
export function AffinityWall({ wall, problems, funnel }: { wall: WallData; problems: string[]; funnel: [string, string][] }) {
  const root = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const resize = new ResizeObserver(([e]) => setW(e.contentRect.width || 1200));
    resize.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase(3); return () => resize.disconnect(); }
    const timers: number[] = [];
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      timers.push(window.setTimeout(() => setPhase(1), 1600), window.setTimeout(() => setPhase(2), 4400), window.setTimeout(() => setPhase(3), 7400));
    }, { threshold: 0.05 });
    seen.observe(el);
    return () => { resize.disconnect(); seen.disconnect(); timers.forEach((t) => window.clearTimeout(t)); };
  }, []);
  const typeOrder = wall.types.map(([key]) => key);
  const colorOf = Object.fromEntries(wall.types.map(([key, , color]) => [key, color]));
  const notes = wall.notes.flatMap((group, theme) => group.map(([text, who, type]) => ({ text, who, type, theme })));
  const rand = (seed: number) => { const x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); };
  // The rest of what was said, as small blank stickies per theme (total per theme from the board).
  const tiny = wall.themes.flatMap(([, , total = 0], theme) => {
    const keyCount = wall.notes[theme]?.length ?? 0;
    return Array.from({ length: Math.max(0, total - keyCount) }, (_, k) => ({ theme, k }));
  });
  const gap = w >= 900 ? 12 : 8;
  const labelH = w >= 900 ? 72 : 60;
  const noteH = w >= 900 ? 148 : 156;
  const tS = w >= 900 ? 12 : 9;
  const tG = 3;
  const colsFor = (wide: number, mid: number, narrow: number) => (w >= 1100 ? wide : w >= 640 ? mid : narrow);
  type At = { x: number; y: number; w: number; h: number; o: number };
  // A mosaic of tiny notes inside a box, row by row.
  const mosaic = (ids: number[], x: number, y: number, width: number, out: Map<number, At>, o = 0.45) => {
    const per = Math.max(1, Math.floor((width + tG) / (tS + tG)));
    ids.forEach((id, i) => out.set(id, { x: x + (i % per) * (tS + tG), y: y + Math.floor(i / per) * (tS + tG), w: tS, h: tS * 0.82, o }));
    return Math.ceil(ids.length / per) * (tS + tG);
  };
  // Phase 0: everything small and spread out.
  const field = Math.max(420, Math.ceil((notes.length + tiny.length) / Math.max(1, Math.floor(w / 26))) * 26 + labelH);
  const key0 = new Map<number, At>();
  const tiny0 = new Map<number, At>();
  notes.forEach((_, n) => key0.set(n, { x: rand(n + 11) * (w - tS * 1.6), y: labelH + rand(n + 57) * (field - labelH - tS), w: tS * 1.6, h: tS * 1.3, o: 1 }));
  tiny.forEach((_, i) => tiny0.set(i, { x: rand(i + 211) * (w - tS), y: labelH + rand(i + 977) * (field - labelH - tS), w: tS, h: tS * 0.82, o: 0.85 }));
  // Phase 1: key notes as a wall sorted by type; the rest as a mosaic under it, sorted by type too.
  const c1 = colsFor(6, 4, 2);
  const w1 = (w - gap * (c1 - 1)) / c1;
  const sorted = [...notes.keys()].sort((a, b) => typeOrder.indexOf(notes[a].type) - typeOrder.indexOf(notes[b].type) || a - b);
  const key1 = new Map<number, At>(sorted.map((n, i) => [n, { x: (i % c1) * (w1 + gap), y: labelH + Math.floor(i / c1) * (noteH + gap), w: w1, h: noteH, o: 1 }]));
  const wallH = labelH + Math.ceil(notes.length / c1) * (noteH + gap);
  const tiny1 = new Map<number, At>();
  const tinySorted = [...tiny.keys()];
  const h1 = wallH + 24 + mosaic(tinySorted, 0, wallH + 24, w, tiny1, 0.35);
  // Columns (phases 2 and 3): key notes stacked, the rest as a mosaic under them.
  const columns = (groups: { keys: number[]; tiny: number[] }[], cols: number) => {
    const cw = (w - gap * (cols - 1)) / cols;
    const per = Math.max(1, Math.floor((cw + tG) / (tS + tG)));
    const heightOf = (g: { keys: number[]; tiny: number[] }) => labelH + g.keys.length * (noteH + gap) + 12 + Math.ceil(g.tiny.length / per) * (tS + tG);
    const bands: number[] = [];
    groups.forEach((g, i) => { const b = Math.floor(i / cols); bands[b] = Math.max(bands[b] ?? 0, heightOf(g)); });
    const bandTop = bands.map((_, b) => bands.slice(0, b).reduce((sum, h) => sum + h + 40, 0));
    const keys = new Map<number, At>();
    const small = new Map<number, At>();
    const labels = groups.map((_, i) => ({ x: (i % cols) * (cw + gap), y: bandTop[Math.floor(i / cols)], w: cw }));
    groups.forEach((g, i) => {
      g.keys.forEach((n, k) => keys.set(n, { x: labels[i].x, y: labels[i].y + labelH + k * (noteH + gap), w: cw, h: noteH, o: 1 }));
      mosaic(g.tiny, labels[i].x, labels[i].y + labelH + g.keys.length * (noteH + gap) + 12, cw, small);
    });
    return { keys, small, labels, height: bandTop[bands.length - 1] + bands[bands.length - 1] };
  };
  const themeGroups = wall.themes.map((_, t) => ({ keys: notes.flatMap((note, n) => (note.theme === t ? [n] : [])), tiny: tiny.flatMap((note, i) => (note.theme === t ? [i] : [])) }));
  const p2 = columns(themeGroups, colsFor(7, 4, 2));
  const problemGroups = problems.map((_, pi) => {
    const ts = wall.themes.flatMap(([, problem], t) => (problem === pi ? [t] : []));
    return { keys: ts.flatMap((t) => themeGroups[t].keys), tiny: ts.flatMap((t) => themeGroups[t].tiny) };
  });
  const p3 = columns(problemGroups, colsFor(4, 2, 1));
  // A theme left out of the problems fades where it stood.
  wall.themes.forEach(([, problem], t) => {
    if (problem >= 0) return;
    themeGroups[t].keys.forEach((n) => { const at = p2.keys.get(n); if (at) p3.keys.set(n, { ...at, o: 0 }); });
    themeGroups[t].tiny.forEach((i) => { const at = p2.small.get(i); if (at) p3.small.set(i, { ...at, o: 0 }); });
  });
  const height = Math.max(field, h1, p2.height, p3.height);
  const keyAt = (n: number) => [key0, key1, p2.keys, p3.keys][phase].get(n);
  const tinyAt = (i: number) => [tiny0, tiny1, p2.small, p3.small][phase].get(i);
  const step = phase <= 1 ? 0 : phase - 1;
  const box = (at: At | undefined): CSSProperties => (at ? { width: at.w, height: at.h, opacity: at.o, transform: `translate(${at.x}px, ${at.y}px)` } : { opacity: 0 });
  return (
    <div className="dv-wall dv-gap-40">
      <ol className="dv-wall-steps" aria-label={wall.steps.join(" → ")}>
        {funnel.map(([n, label], i) => <li key={label} data-on={i === step || undefined} data-done={i < step || undefined}><strong>{n}</strong><span>{label}</span><small>{wall.steps[i]}</small></li>)}
      </ol>
      <div ref={root} className="dv-wall-stage" data-phase={phase} style={{ height }} aria-hidden="true">
        <div className="dv-wall-legend" data-on={phase <= 1 || undefined}>
          {wall.types.map(([key, label, color]) => <span key={key}><i style={{ background: color }} />{label}</span>)}
        </div>
        {p2.labels.map((l, t) => <p key={`t${t}`} className="dv-wall-label" data-on={phase === 2 || undefined} style={{ left: l.x, top: l.y, width: l.w }}>{wall.themes[t][0]}</p>)}
        {p3.labels.map((l, pi) => <p key={`p${pi}`} className="dv-wall-label dv-wall-problem" data-on={phase === 3 || undefined} style={{ left: l.x, top: l.y, width: l.w }}><b>{String(pi + 1).padStart(2, "0")}</b>{problems[pi]}</p>)}
        {tiny.map((_, i) => <i key={`s${i}`} className="dv-wall-tiny" style={{ ...box(tinyAt(i)), transitionDelay: `${Math.round(rand(i + 5) * 400)}ms` }} />)}
        {notes.map((note, n) => (
          <div key={n} className="dv-wall-note" data-small={phase === 0 || undefined} style={{ ...box(keyAt(n)), background: colorOf[note.type], transitionDelay: `${(n % 6) * 40}ms` }}>
            <p>{note.text}</p>
            <span>{note.who}</span>
          </div>
        ))}
      </div>
      <p className="dv-wall-aside" data-on={phase === 3 || undefined}>{wall.aside}</p>
      <div className="sr-only">
        <ol>{problems.map((title, pi) => <li key={title}>{title}: {wall.themes.filter(([, p]) => p === pi).map(([name]) => name).join(", ")}</li>)}</ol>
      </div>
    </div>
  );
}

// Affinity mapping after a sticky-note board (owner's reference): short notes, coloured by
// participant, start mixed on the board, settle into the seven theme columns, then the notes behind
// each problem gather into a circle with the problem's name above and one line under it. Notes are
// shortened from real interview quotes. Plays once when in view and stays on the circles; reduced
// motion shows the circles.
const AFF_RINGS = ["#5b8def", "#e5674f", "#3fb37f", "#d9a23a"];
const AFF_PEOPLE: Record<string, string> = { P01: "#9fe0c8", P02: "#f6a7b9", P03: "#c2b0f5", P04: "#ffe08a" };

export function AffinityMap({ wall, problems, people, funnel }: { wall: WallData & { short: string[]; legendNote: string }; problems: { title: string; body: string }[]; people: string[][]; funnel: [string, string][] }) {
  const root = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1200);
  const [timed, setPhase] = useState(0);
  // With room and motion the map holds on screen and native scroll moves it from the mixed
  // notes to the themes to the problems; elsewhere it plays once by itself.
  const held = useHeldSteps(3);
  const phase = held.pinned ? held.active : timed;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const resize = new ResizeObserver(([e]) => setW(e.contentRect.width || 1200));
    resize.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase(2); return () => resize.disconnect(); }
    if (window.matchMedia(REELS_PIN).matches) return () => resize.disconnect();
    const timers: number[] = [];
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      timers.push(window.setTimeout(() => setPhase(1), 900), window.setTimeout(() => setPhase(2), 4600));
    }, { threshold: 0.2 });
    seen.observe(el);
    return () => { resize.disconnect(); seen.disconnect(); timers.forEach((t) => window.clearTimeout(t)); };
  }, []);
  const notes = wall.notes.flatMap((group, theme) => group.map(([, who]) => ({ who, theme })));
  const rand = (seed: number) => { const x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); };
  const wide = w >= 1000;
  const gap = wide ? 14 : 10;
  const labelH = wide ? 56 : 48;
  type At = { x: number; y: number; w: number; h: number; r: number; o: number };
  // Board: theme columns.
  const bc = w >= 1100 ? 7 : w >= 640 ? 4 : 2;
  const bw = (w - gap * (bc - 1)) / bc;
  const bh = wide ? 64 : 72;
  const byTheme = wall.themes.map((_, t) => notes.flatMap((n, i) => (n.theme === t ? [i] : [])));
  const bandRows: number[] = [];
  byTheme.forEach((g, t) => { const b = Math.floor(t / bc); bandRows[b] = Math.max(bandRows[b] ?? 0, g.length); });
  const bandTop = bandRows.map((_, b) => bandRows.slice(0, b).reduce((sum, n) => sum + labelH + n * (bh + 8) + 32, 0));
  const board = new Map<number, At>();
  const themeLabels = byTheme.map((g, t) => {
    const x = (t % bc) * (bw + gap);
    const y = bandTop[Math.floor(t / bc)];
    g.forEach((i, k) => board.set(i, { x, y: y + labelH + k * (bh + 8), w: bw, h: bh, r: (rand(i + 3) - 0.5) * 3, o: 1 }));
    return { x, y, w: bw };
  });
  const boardH = bandTop[bandTop.length - 1] + labelH + bandRows[bandRows.length - 1] * (bh + 8);
  // Start: mixed over the same area, tilted.
  const start = new Map<number, At>(notes.map((_, i) => [i, { x: rand(i + 17) * (w - bw), y: labelH + rand(i + 71) * Math.max(120, boardH - labelH - bh), w: bw, h: bh, r: (rand(i + 5) - 0.5) * 18, o: 1 }]));
  // Circles: four clusters, notes 2 x 2 inside a ring, the problem above and one line under it.
  const cc = w >= 1000 ? 4 : w >= 560 ? 2 : 1;
  const cw = (w - gap * (cc - 1)) / cc;
  const d = Math.min(cw - 8, 300);
  const cn = d * 0.46;
  const titleH = 64;
  const lineH = 16;
  const clusterH = titleH + d + lineH;
  const clusters = problems.map((p, pi) => {
    const cx = (pi % cc) * (cw + gap) + cw / 2;
    const top = Math.floor(pi / cc) * (clusterH + 24);
    return { ...p, cx, top, cy: top + titleH + d / 2 };
  });
  const circle = new Map<number, At>();
  problems.forEach((_, pi) => {
    const ids = wall.themes.flatMap(([, problem], t) => (problem === pi ? byTheme[t] : [])).slice(0, 4);
    const { cx, cy } = clusters[pi];
    ids.forEach((i, k) => circle.set(i, { x: cx - cn - 3 + (k % 2) * (cn + 6), y: cy - cn - 3 + Math.floor(k / 2) * (cn + 6), w: cn, h: cn, r: (rand(i + 9) - 0.5) * 4, o: 1 }));
  });
  // Notes behind no problem fade where they stood on the board.
  notes.forEach((_, i) => { if (!circle.has(i)) { const at = board.get(i)!; circle.set(i, { ...at, o: 0 }); } });
  const circlesH = Math.ceil(problems.length / cc) * (clusterH + 24);
  const height = phase === 2 && !held.pinned ? circlesH : Math.max(boardH, circlesH);
  const at = (i: number) => (phase === 0 ? start : phase === 1 ? board : circle).get(i)!;
  const step = phase === 2 ? 2 : phase === 1 ? 1 : 0;
  return (
    <div ref={held.root} className="dv-held-track dv-amap-track dv-gap-40" style={{ "--n": 3 } as CSSProperties}>
    <div className="dv-amap">
      <ol className="dv-wall-steps" aria-label={wall.steps.join(" → ")}>
        {funnel.map(([n, label], i) => <li key={label} data-on={i === step || undefined} data-done={i < step || undefined}><strong>{n}</strong><span>{label}</span></li>)}
      </ol>
      <div ref={root} className="dv-amap-stage" data-phase={phase} style={{ height }} aria-hidden="true">
        {themeLabels.map((l, t) => <p key={t} className="dv-amap-theme" data-on={phase === 1 || undefined} style={{ left: l.x, top: l.y, width: l.w }}>{wall.themes[t][0]}</p>)}
        {clusters.map((c, pi) => (
          <div key={c.title} className="dv-amap-cluster" data-on={phase === 2 || undefined} style={{ left: c.cx - cw / 2, top: c.top, width: cw } as CSSProperties}>
            <p className="dv-amap-title"><b>{pi + 1}</b>{c.title}</p>
            <i className="dv-amap-bar" style={{ background: AFF_RINGS[pi % 4] }} />
            <span style={{ display: "block", height: d - 4 }} />
          </div>
        ))}
        {notes.map((n, i) => {
          const a = at(i);
          return (
            <div key={i} className="dv-amap-note" style={{ width: a.w, height: a.h, opacity: a.o, background: AFF_PEOPLE[n.who] ?? "#ddd", transform: `translate(${a.x}px, ${a.y}px) rotate(${a.r}deg)`, transitionDelay: `${Math.round(rand(i + 13) * 300)}ms` }}>
              {wall.short[i]}
            </div>
          );
        })}
      </div>
      <div className="dv-amap-people">
        {people.map(([id, role]) => <span key={id}><i style={{ background: AFF_PEOPLE[id] }} />{id} · {role}</span>)}
      </div>
      <div className="sr-only"><ol>{problems.map((p, pi) => <li key={p.title}>{p.title}: {wall.themes.filter(([, x]) => x === pi).map(([name]) => name).join(", ")}</li>)}</ol></div>
    </div>
    </div>
  );
}

// One screen of the spec as a still document part: the screenshot with numbered pins and, beside or
// under it, the same numbers with element, behavior and states. Nothing plays by itself.
function SpecShot({ screen, lit = -1, onPin }: { screen: SpecScreen; lit?: number; onPin?: (n: number) => void }) {
  const at = lit >= 0 ? screen.pins[lit] : undefined;
  return (
    <div className="dv-hdoc-shot" data-zoom={at ? "" : undefined}>
      <div className="dv-hdoc-lens" style={at ? ({ transformOrigin: `${at[0]}% ${at[1]}%` } as CSSProperties) : undefined}>
        <Image src={withBase(screen.src)} alt={screen.alt} width={2160} height={1350} sizes="(min-width: 64rem) 60vw, 100vw" />
        {screen.pins.map(([x, y], n) => <span key={n} className="dv-hdoc-pin" aria-hidden="true" data-lit={n === lit || undefined} style={{ left: `${x}%`, top: `${y}%`, "--i": n } as CSSProperties} onPointerEnter={() => onPin?.(n)} onPointerLeave={() => onPin?.(-1)}>{n + 1}</span>)}
      </div>
    </div>
  );
}

function SpecRows({ screen, cols, lit = -1, onRow, brief }: { screen: SpecScreen; cols: SpecData["cols"]; lit?: number; onRow?: (n: number) => void; brief?: boolean }) {
  return (
    <table className="dv-hdoc-table" data-brief={brief || undefined}>
      <thead><tr><th scope="col"><span className="sr-only">#</span></th><th scope="col">{cols.name}</th><th scope="col">{cols.does}</th><th scope="col">{cols.state}</th></tr></thead>
      <tbody>
        {screen.rows.map(([name, does, state], n) => (
          <tr key={name} data-lit={n === lit || undefined} onPointerEnter={() => onRow?.(n)} onPointerLeave={() => onRow?.(-1)}><td><b>{n + 1}</b></td><th scope="row">{name}</th><td>{does}</td><td>{state === "-" ? "—" : state}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

// The case page shows one screen of the spec with only its key elements (owner: four tabbed
// screens with six rows each were too much); everything else is on the full spec page.
export function HandoffOne({ spec, screenId, keep, more, moreHref }: { spec: SpecData; screenId: string; keep: number[]; more: string; moreHref: string }) {
  const full = spec.screens.find((item) => item.id === screenId) ?? spec.screens[0];
  const screen = { ...full, pins: keep.map((n) => full.pins[n]), rows: keep.map((n) => full.rows[n]) };
  const [lit, setLit] = useState(-1);
  return (
    <div className="dv-hdoc-excerpt dv-hdoc-one dv-gap-40 reveal">
      <p className="dv-hdoc-purpose dv-hdoc-one-purpose"><b>{full.tab}</b> — {full.purpose}</p>
      <div className="dv-hdoc-pair">
        <SpecShot screen={screen} lit={lit} onPin={setLit} />
        <SpecRows screen={screen} cols={spec.cols} lit={lit} onRow={setLit} />
      </div>
      <p className="dv-hdoc-more"><Link className="link" href={moreHref}>{more}</Link></p>
    </div>
  );
}

// The case page shows one screen of the handoff spec as an excerpt and links to the full document
// (owner: the auto-playing card was slow and busy; the whole spec belongs on its own page).
export function HandoffExcerpt({ spec, screenId, more, moreHref }: { spec: SpecData; screenId: string; more: string; moreHref: string }) {
  const first = Math.max(0, spec.screens.findIndex((item) => item.id === screenId));
  const held = useHeldSteps(spec.screens.length, TALL_PIN);
  const [chosen, setCurrent] = useState(first);
  const current = held.pinned ? held.active : chosen;
  const [lit, setLit] = useState(-1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const screen = spec.screens[current];
  const pick = (i: number) => { if (held.pinned) held.go(i); else setCurrent(i); setLit(-1); };
  const onKeys = (event: React.KeyboardEvent) => {
    const last = spec.screens.length - 1;
    const next = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    pick(next);
    tabs.current[next]?.focus();
  };
  return (
    <div className="dv-hdoc-excerpt dv-gap-40 reveal">
      <div ref={held.root} className="dv-held-track dv-held-tall" style={{ "--n": spec.screens.length } as CSSProperties}>
      <div className="dv-hdoc-hold">
      <div className="dv-hdoc-tabs" role="tablist" aria-label={spec.labels.elements} onKeyDown={onKeys}>
        {spec.screens.map((item, i) => (
          <button key={item.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`hx-tab-${item.id}`} aria-selected={i === current} aria-controls="hx-panel" tabIndex={i === current ? 0 : -1} onClick={() => pick(i)}>
            <b>{i + 1}</b>{item.tab}
          </button>
        ))}
      </div>
      <div id="hx-panel" role="tabpanel" aria-labelledby={`hx-tab-${screen.id}`} className="dv-hdoc-panel" key={screen.id}>
        <p className="dv-hdoc-purpose">{screen.purpose}</p>
        <div className="dv-hdoc-pair">
          <SpecShot screen={screen} lit={lit} onPin={setLit} />
          <SpecRows screen={screen} cols={spec.cols} lit={lit} onRow={setLit} brief />
        </div>
      </div>
      </div>
      </div>
        <details className="dv-hdoc-fold" key={`cols-${screen.id}`}>
        <summary>{spec.labels.accept} · {spec.labels.tokens} · {spec.labels.code}</summary>
        <div className="dv-hdoc-cols">
          <div><h4>{spec.labels.accept}</h4><ul>{screen.accept.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h4>{spec.labels.tokens}</h4><ul>{screen.tokens.map((item) => <li key={item}>{tokenText(item)}</li>)}</ul></div>
          <div><h4>{spec.labels.code}</h4><ul>{screen.code.map(([label, href]) => <li key={href}><a className="link" href={href} target="_blank" rel="noreferrer"><code>{label}</code> ↗</a></li>)}</ul></div>
        </div>
        </details>
      <p className="dv-hdoc-more"><Link className="link" href={moreHref}>{more}</Link></p>
    </div>
  );
}

// The full handoff as a document: every screen open, one after another, each with its purpose, the
// pinned screenshot, the element table, what "done" means, tokens and code links.
export function HandoffDoc({ spec }: { spec: SpecData }) {
  return (
    <div className="dv-hdoc">
      <nav className="dv-hdoc-toc" aria-label={spec.labels.elements}>
        <ol>{spec.screens.map((screen, i) => <li key={screen.id}><a className="link" href={`#spec-${screen.id}`}>{i + 1}. {screen.tab}</a></li>)}</ol>
      </nav>
      {spec.screens.map((screen, i) => (
        <section key={screen.id} id={`spec-${screen.id}`} className="dv-hdoc-screen" aria-labelledby={`spec-${screen.id}-title`}>
          <h3 id={`spec-${screen.id}-title`}><b>{i + 1}</b>{screen.tab}</h3>
          <p className="dv-hdoc-purpose">{screen.purpose}</p>
          <SpecShot screen={screen} />
          <SpecRows screen={screen} cols={spec.cols} />
          <div className="dv-hdoc-cols">
            <div><h4>{spec.labels.accept}</h4><ul>{screen.accept.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h4>{spec.labels.tokens}</h4><ul>{screen.tokens.map((item) => <li key={item}>{tokenText(item)}</li>)}</ul></div>
            <div><h4>{spec.labels.code}</h4><ul>{screen.code.map(([label, href]) => <li key={href}><a className="link" href={href} target="_blank" rel="noreferrer"><code>{label}</code> ↗</a></li>)}</ul></div>
          </div>
        </section>
      ))}
      <div className="dv-hdoc-notes">
        <p>{spec.shared}</p>
        <p>{spec.open}</p>
      </div>
    </div>
  );
}

export function HandoffSpec({ spec, auto = true }: { spec: SpecData; auto?: boolean }) {
  const screens = spec.screens;
  const [current, setCurrent] = useState(0);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(!auto);
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (i: number) => { setCurrent(i); setStep(0); };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const allowed = window.matchMedia("(min-width: 48rem) and (prefers-reduced-motion: no-preference)");
    const sync = () => setCanPlay(allowed.matches);
    sync();
    allowed.addEventListener("change", sync);
    const watch = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 });
    watch.observe(el);
    return () => { allowed.removeEventListener("change", sync); watch.disconnect(); };
  }, []);
  const stepsOf = (screen: SpecScreen) => [
    ...screen.rows.map(([name, does, state]) => ({ label: name, text: name + does + state })),
    { label: spec.labels.accept, text: screen.accept.join("") },
    { label: spec.labels.dev, text: screen.tokens.join("") + screen.code.map(([label]) => label).join("") },
  ];
  const advance = () => {
    if (step < stepsOf(screens[current]).length - 1) setStep(step + 1);
    else pick((current + 1) % screens.length);
  };
  const running = canPlay && !paused && !held && seen;
  const onTabKeys = (event: React.KeyboardEvent) => {
    const last = screens.length - 1;
    const next = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    pick(next);
    tabs.current[next]?.focus();
  };
  return (
    <div ref={root} className="dv-spec dv-gap-40 reveal" onFocus={(event) => { if (event.target.matches(":focus-visible")) setHeld(true); }} onBlur={() => setHeld(false)}>
      {screens.length > 1 && <div className="dv-spec-tabs" role="tablist" onKeyDown={onTabKeys}>
        {screens.map((screen, i) => (
          <button key={screen.id} ref={(el) => { tabs.current[i] = el; }} id={`spec-tab-${screen.id}`} type="button" role="tab" aria-selected={i === current} aria-controls={`spec-panel-${screen.id}`} tabIndex={i === current ? 0 : -1} onClick={() => pick(i)}>{screen.tab}</button>
        ))}
      </div>}
      <div className="dv-spec-panels">
      {screens.map((screen, i) => {
        const on = i === current;
        const steps = stepsOf(screen);
        const count = screen.rows.length;
        const zoomed = on && step < count && screen.pins[step];
        return (
        <div key={screen.id} id={`spec-panel-${screen.id}`} className="dv-spec-panel" role={screens.length > 1 ? "tabpanel" : undefined} aria-labelledby={screens.length > 1 ? `spec-tab-${screen.id}` : undefined} data-on={on || undefined}>
          <div className="dv-spec-shot">
            <div className="dv-spec-frame">
              <div className="dv-spec-zoom" style={zoomed ? specZoom(zoomed[0], zoomed[1]) : undefined}>
                <Image src={withBase(screen.src)} alt={screen.alt} width={2160} height={1350} sizes="(min-width: 64rem) 70vw, 100vw" />
                {screen.pins.map(([x, y], n) => (
                  <span key={n} className="dv-spec-pin" data-lit={(on && n === step) || undefined} aria-hidden="true" style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setStep(n)}>{n + 1}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="dv-spec-side" onPointerEnter={(event) => { if (event.pointerType === "mouse") setHeld(true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setHeld(false); }}>
            <p className="dv-spec-purpose">{screen.purpose}</p>
            <div className="dv-spec-subs">
              <div className="dv-spec-sub" data-on={step < count || undefined}>
                <div className="dv-spec-els">
                  {screen.rows.map(([name, does, state], n) => (
                    <div key={name} className="dv-spec-el" data-on={n === step || undefined}>
                      <h4><b aria-hidden="true">{n + 1}</b>{name}</h4>
                      <p>{does}</p>
                      {state !== "-" && <p className="dv-spec-state"><span>{spec.cols.state}</span>{state}</p>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="dv-spec-sub dv-spec-detail" data-on={step === count || undefined}>
                <h4>{spec.labels.accept}</h4>
                <ul>{screen.accept.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="dv-spec-sub dv-spec-detail" data-on={step === count + 1 || undefined}>
                <h4>{spec.labels.tokens}</h4>
                <ul>{screen.tokens.map((item) => <li key={item}>{tokenText(item)}</li>)}</ul>
                <h4>{spec.labels.code}</h4>
                <ul>{screen.code.map(([label, href]) => <li key={href}><a className="link" href={href} target="_blank" rel="noreferrer"><code>{label}</code> ↗</a></li>)}</ul>
              </div>
            </div>
            {on && <div className="dv-spec-progress">
              {canPlay && <button type="button" className="dv-spec-play" aria-label={paused ? spec.labels.play : spec.labels.pause} onClick={() => setPaused(!paused)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">{paused ? <path d="M2.5 1v10l8-5z" /> : <path d="M2 1h3v10H2zM7 1h3v10H7z" />}</svg>
              </button>}
              <div className="dv-spec-bars">
                {steps.map((item, n) => (
                  <button key={item.label} type="button" aria-label={item.label} aria-current={n === step ? "step" : undefined} data-done={n < step || undefined} onClick={() => setStep(n)}>
                    {n === step && <i key={`${current}-${n}`} data-run={canPlay || undefined} style={{ animationDuration: `${specDwell(item.text)}ms`, animationPlayState: running ? "running" : "paused" }} onAnimationEnd={advance} />}
                  </button>
                ))}
              </div>
            </div>}
          </div>
        </div>
        );
      })}
      </div>
      <p className="dv-spec-note">{spec.shared}</p>
      <p className="dv-spec-note">{spec.open}</p>
    </div>
  );
}
