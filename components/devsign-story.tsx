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
        <video ref={video} src={near ? withBase(change.clip.src) : undefined} poster={withBase(change.clip.poster)} muted loop={!pinned} playsInline preload={near ? "auto" : "none"} controls={still || refused} onEnded={onEnd} width={1600} height={1000} aria-label={`${change.title}. ${labels.asIs}: ${change.before} ${labels.toBe}: ${change.after}`}
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
function useHeldSteps(count: number) {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const measure = (el: HTMLElement) => {
    const stage = (el.firstElementChild as HTMLElement).offsetHeight;
    // Centred on the screen, below the header when the screen is short.
    return { top: Math.max(76, Math.round((window.innerHeight - stage) / 2) + 20), travel: el.offsetHeight - stage };
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    let scrollStep = -1;
    const read = () => {
      frame = 0;
      const { top, travel } = measure(el);
      const progress = travel > 0 ? Math.min(1, Math.max(0, (top - el.getBoundingClientRect().top) / travel)) : 0;
      el.style.setProperty("--stage-top", `${top}px`);
      // Only a scroll into another step takes over from a step that moved on by itself.
      const step = Math.min(count - 1, Math.floor(progress * count));
      if (step !== scrollStep) { scrollStep = step; setActive(step); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    const query = window.matchMedia(REELS_PIN);
    const sync = () => setPinned(query.matches);
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
  }, [count]);
  const go = (i: number) => {
    const el = root.current;
    if (!el) return;
    setActive(i);
    const { top, travel } = measure(el);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - top + ((i + 0.5) / count) * travel, behavior: "smooth" });
  };
  return { root, active, setActive, pinned, go };
}

function StepMarks({ names, active, go }: { names: string[]; active: number; go: (i: number) => void }) {
  return (
    <div className="dv-reel-steps">
      {names.map((name, i) => <button key={name} type="button" aria-label={name} aria-current={i === active ? "step" : undefined} data-done={i <= active || undefined} onClick={() => go(i)} />)}
    </div>
  );
}

// A clip that ends hands over to the next, round to the first, without moving the page;
// scrolling into another step takes over again.
export function IterationCompare({ changes, labels }: { changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const { root, active, setActive, pinned, go } = useHeldSteps(changes.length);
  return (
    <div ref={root} className="dv-iter" style={{ "--n": changes.length } as CSSProperties}>
      <div className="dv-iter-stage">
        <ol className="dv-iter-steps">
          {changes.map((c, i) => <IterationStep key={c.title} change={c} index={i} total={changes.length} pinned={pinned} active={i === active} labels={labels} onEnd={() => setActive((i + 1) % changes.length)} />)}
        </ol>
        {pinned && <StepMarks names={changes.map((c) => c.title)} active={active} go={go} />}
      </div>
    </div>
  );
}

// The same holding card for still phone screens: the whole screen on the case's colour, and
// what changed beside it. The As-is line has no screen of its own, so it isn't a switch.
type ScreenChange = { title: string; before: string; after: string; src: string; alt?: string; width?: number; height?: number };
export function ScreenSteps({ changes, labels }: { changes: ScreenChange[]; labels: { asIs: string; toBe: string } }) {
  const { root, active, pinned, go } = useHeldSteps(changes.length);
  return (
    <div ref={root} className="dv-iter dv-screens-held" style={{ "--n": changes.length } as CSSProperties}>
      <div className="dv-iter-stage">
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
        {pinned && <StepMarks names={changes.map((c) => c.title)} active={active} go={go} />}
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
      <p className="dv-vpc-title reveal">{overviewLabel}</p>
      <div className="dv-vpc-pairs reveal">
        <p className="dv-vpc-head" aria-hidden="true"><span>{painLabel}</span><i /><span>{reliefLabel}</span><i /><span>{featureLabel}</span></p>
        {rows.map((c) => (
          <p key={c.id} className="dv-vpc-pair">
            <span>{c.pain}</span>
            <i aria-hidden="true">→</i>
            <span>{c.name}</span>
            <i aria-hidden="true">→</i>
            <b>{c.to}</b>
          </p>
        ))}
      </div>
      <ul className="sr-only">
        {others.map((c) => <li key={c.id}>{c.name}: {c.pain} → {c.to}</li>)}
      </ul>
    </div>
  );
}

// A smaller iteration: As-is and To-be side by side as two cards, the same part of the screen at
// one shape, so the difference reads at a glance. Only To-be sits on the case's colour.
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
    return () => { nearby.disconnect(); half.disconnect(); };
  }, []);
  // One plays at a time: As-is, then To-be, round again.
  useEffect(() => {
    if (manual) return;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === turn && onScreen && near) { v.currentTime = 0; v.play().catch(() => setManual(true)); }
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
              <video ref={(el) => { videos.current[i] = el; }} src={near ? withBase(side.clip.src) : undefined} poster={withBase(side.clip.poster)} muted playsInline preload={near ? "auto" : "none"} controls={manual} width={1440} height={686} aria-label={`${side.alt ?? tag} ${side.text}`} onEnded={() => setTurn(i === 0 ? 1 : 0)} />
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
type Reel = { id: string; kicker: string; name: string; body: string; alt?: string; points: string[]; clip: { src: string; poster: string; marks: number[] }; solves?: React.ReactNode };
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
const REELS_PIN = "(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

// On desktop one card holds still on the screen: the clip on its colour at the left, the
// text at the right, and native scroll changes what's inside. The steps show where you are
// and jump there. Elsewhere each feature is its own card, clip above its text.
export function FeatureReels({ reels }: { reels: Reel[] }) {
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
        <ul className="dv-reels">
          {reels.map((reel, index) => <FeatureReel key={reel.id} reel={reel} active={index === current} pinned={pinned} load={!pinned || index <= current + 1} />)}
        </ul>
        {pinned && (
          <div className="dv-reel-steps">
            {reels.map((reel, index) => (
              <button key={reel.id} type="button" aria-label={reel.name} aria-current={index === current ? "step" : undefined} data-done={index <= current || undefined} onClick={() => go(index)} />
            ))}
          </div>
        )}
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
      {children}
      <ol className="dv-panels reveal">
        {items.map((item, i) => (
          <li key={item.title}>
            <b className="dv-panel-num">{pad(i + 1)}</b>
            <div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
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
