"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1;

type Shot = { src: string; alt?: string; text: string; lead?: string };
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

// Only what is inside the box, fitted into a tile of one shape: no outline, no
// surrounding screen, and never blown up past 1.6x (the shots are 2x).
function Crop({ img, box, tile }: { img: Shot; box: Box; tile: number }) {
  const [x, y, w, h] = box;
  const ratio = (w * 16) / (h * 9);
  return (
    <span className="dv-iter-crop" style={{ width: `min(${Math.min(100, (100 * ratio) / tile)}%, ${w * 14.4 * 1.6}px)`, aspectRatio: ratio }}>
      <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 767px) 300vw, 200vw" style={{ width: `${(100 / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }} />
    </span>
  );
}

function CropPair({ before, after, a, b, lines, labels, tile = 1.6 }: { before: Shot; after: Shot; a: Box; b: Box; lines: [string, string]; labels: { asIs: string; toBe: string }; tile?: number }) {
  const sides = [
    { key: "a", tag: labels.asIs, img: before, box: a, line: lines[0] },
    { key: "b", tag: labels.toBe, img: after, box: b, line: lines[1] },
  ] as const;
  return (
    <div className="dv-iter-pair">
      {sides.map(({ key, tag, img, box, line }) => (
        <figure key={key} className="dv-iter-side" data-side={key}>
          <span className="dv-iter-tag">{tag}</span>
          <div className="dv-iter-view" style={{ aspectRatio: tile }}><Crop img={img} box={box} tile={tile} /></div>
          <figcaption>{line}</figcaption>
        </figure>
      ))}
    </div>
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

// Scroll-driven steps, the usual pinned pattern: the stage stays on screen (CSS
// sticky) and one change at a time crossfades in place as the page scrolls. A clip
// that ends hands over to the next, round to the first, without moving the page;
// scrolling into another step takes over again. Native scroll only. On phones and
// with reduced motion (CSS) the steps are a plain list.
export function IterationCompare({ changes, labels }: { changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    let scrollStep = -1;
    const read = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const stage = (el.firstElementChild as HTMLElement).offsetHeight;
      // The stage is only as tall as its content and pins centred on the screen.
      const top = Math.max(24, (window.innerHeight - stage) / 2);
      const travel = box.height - stage;
      const progress = travel > 0 ? Math.min(1, Math.max(0, (top - box.top) / travel)) : 0;
      el.style.setProperty("--stage-top", `${top}px`);
      // Only a scroll into another step takes over from a clip that moved on by itself.
      const step = Math.min(changes.length - 1, Math.floor(progress * changes.length));
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
  }, [changes.length]);
  return (
    <div ref={root} className="dv-iter" style={{ "--n": changes.length } as React.CSSProperties}>
      <div className="dv-iter-stage">
        <ol className="dv-iter-steps">
          {changes.map((c, i) => <IterationStep key={c.title} change={c} index={i} total={changes.length} pinned={pinned} active={i === active} labels={labels} onEnd={() => setActive((i + 1) % changes.length)} />)}
        </ol>
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

// A smaller iteration: one pair, the changed part only.
export function IterationPair({ before, after, labels }: { before: Shot & { box: Box }; after: Shot & { box: Box }; labels: { asIs: string; toBe: string } }) {
  return (
    <div className="reveal">
      <CropPair before={before} after={after} a={before.box} b={after.box} lines={[before.text, after.text]} labels={labels} tile={2.1} />
    </div>
  );
}

// One core feature: its one sentence and the real prototype clip. With reduced motion
// nothing autoplays and the video shows its controls. If the browser refuses to
// autoplay (iPhone Low Power Mode, a locked-down classroom PC), the clip shows its
// controls too and tries again on the next press or key, so it is never a dead image.
type Reel = { id: string; kicker: string; name: string; body: string; alt?: string; points: string[]; clip: { src: string; poster: string; marks: number[] }; solves?: React.ReactNode };
function FeatureReel({ reel, row, active, past, pinned, load }: { reel: Reel; row: number; active: boolean; past: boolean; pinned: boolean; load: boolean }) {
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
    <li id={reel.id} className="dv-reel dv-link-target" data-on={active || undefined} data-past={past || undefined} style={{ "--row": row } as CSSProperties}>
      <div className="dv-reel-row">
        <div className="dv-reel-text">
          <div>
            <p className="dv-reel-name"><b>{reel.kicker.split(" ")[0]}</b>{reel.name}<span>{reel.kicker.split(" ").slice(1).join(" ")}</span></p>
            <h4 className="dv-reel-line">{reel.body}</h4>
            {reel.solves && <p className="dv-reel-solves">{reel.solves}</p>}
          </div>
          <ol className="dv-reel-points">
            {reel.points.map((text) => <li key={text}>{text}</li>)}
          </ol>
        </div>
      </div>
      <div className="dv-reel-stage">
        <div className="dv-reel-media">
          <video ref={video} src={withBase(reel.clip.src)} poster={withBase(reel.clip.poster)} muted loop playsInline preload={near && load ? "auto" : "none"} controls={still || refused} aria-label={reel.alt ?? reel.name} onPlaying={() => setRefused(false)} />
        </div>
      </div>
    </li>
  );
}

// Keep in step with the pinned rules at the end of globals.css.
const REELS_PIN = "(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

// On desktop the clip stays pinned on the left and each feature's text holds beside it
// on the right. The clip and its colour change where two rows meet, as one text hands
// over to the next. Native scroll only. Elsewhere each feature stacks its text and clip.
export function FeatureReels({ reels }: { reels: Reel[] }) {
  const root = useRef<HTMLUListElement>(null);
  const [pinned, setPinned] = useState(false);
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const query = window.matchMedia(REELS_PIN);
    const update = () => setPinned(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!pinned || !root.current) return;
    const rows = [...root.current.querySelectorAll(".dv-reel-row")];
    const middle = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setCurrent(rows.indexOf(entry.target));
    }, { rootMargin: "-50% 0px -50% 0px" });
    rows.forEach((row) => middle.observe(row));
    return () => middle.disconnect();
  }, [pinned]);
  return (
    <ul ref={root} className="dv-reels dv-gap-40" style={{ "--reels": reels.length } as CSSProperties}>
      {reels.map((reel, index) => <FeatureReel key={reel.id} reel={reel} row={index + 1} active={index === current} past={index < current} pinned={pinned} load={!pinned || index <= current + 1} />)}
    </ul>
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
export function UsabilityResults({ scores, meaning }: { scores: UsabilityScore[]; meaning: string }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const numbers = [...el.querySelectorAll<HTMLElement>("[data-count]")].map((node) => {
      const text = node.dataset.count ?? "0";
      return { node, target: Number(text), decimals: text.split(".")[1]?.length ?? 0 };
    });
    let frame = 0;
    const paint = (progress: (i: number) => number) => numbers.forEach(({ node, target, decimals }, i) => {
      node.textContent = (target * progress(i)).toFixed(decimals);
    });
    paint(() => 0);
    el.dataset.armed = "";
    const play = () => {
      el.dataset.played = "";
      const start = performance.now();
      const tick = (now: number) => {
        const t = (i: number) => Math.min(1, Math.max(0, (now - start - i * COUNT_STAGGER_MS) / COUNT_MS));
        paint((i) => 1 - (1 - t(i)) ** 3);
        if (t(numbers.length - 1) < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        play();
      } else if (entry.boundingClientRect.bottom < 0) {
        observer.disconnect();
        paint(() => 1);
        el.dataset.played = "";
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      paint(() => 1);
      delete el.dataset.armed;
      delete el.dataset.played;
    };
  }, []);

  return (
    <div ref={panel} className="dv-ut-panel reveal">
      <ul className="dv-ut-scores">
        {scores.map((item, i) => (
          <li key={item.title} data-missed={item.missed || undefined} style={{ "--i": i } as React.CSSProperties}>
            <p className="dv-ut-value"><span data-count={item.value}>{item.value}</span><small>{item.unit}</small></p>
            <span className="dv-ut-gauge" aria-hidden="true">
              <i style={{ width: `${item.ratio * 100}%` }} />
              {item.target !== undefined && <b style={{ left: `${item.target * 100}%` }} />}
            </span>
            <strong>{item.title}</strong>
            <span>{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="dv-ut-meaning">{meaning}</p>
    </div>
  );
}

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
type SpecData = { shared: string; open: string; screens: SpecScreen[]; cols: { name: string; does: string; state: string }; labels: { elements: string; states: string; accept: string; dev: string; tokens: string; code: string }; more?: string; moreHref?: string };

// `--ds-token` in the copy reads as code.
const tokenText = (text: string) => text.split(/(`[^`]+`)/).map((part, i) => part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part);

// The handoff spec, one screen's worth at a time: the key screen with numbered pins, and beside
// it a second row of tabs for how it behaves, its states, when it's done, and its tokens and code. Pointing
// at a pin or a row lights the other. Hidden panels keep their place, so nothing jumps between
// tabs. Phones list all of it.
export function HandoffSpec({ spec }: { spec: SpecData }) {
  const screens = spec.screens;
  const [current, setCurrent] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [part, setPart] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const partTabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (i: number) => { setCurrent(i); setLit(null); };
  const parts = [spec.labels.elements, spec.labels.states, spec.labels.accept, spec.labels.dev];
  // Arrow keys, Home and End, for either row of tabs.
  const arrows = (event: React.KeyboardEvent, at: number, count: number, go: (i: number) => void, refs: (HTMLButtonElement | null)[]) => {
    const last = count - 1;
    const next = { ArrowRight: at === last ? 0 : at + 1, ArrowLeft: at === 0 ? last : at - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    go(next);
    refs[next]?.focus();
  };
  return (
    <div className="dv-spec dv-gap-40 reveal">
      {screens.length > 1 && <div className="dv-spec-tabs" role="tablist" onKeyDown={(event) => arrows(event, current, screens.length, pick, tabs.current)}>
        {screens.map((screen, i) => (
          <button key={screen.id} ref={(el) => { tabs.current[i] = el; }} id={`spec-tab-${screen.id}`} type="button" role="tab" aria-selected={i === current} aria-controls={`spec-panel-${screen.id}`} tabIndex={i === current ? 0 : -1} onClick={() => pick(i)}>{screen.tab}</button>
        ))}
      </div>}
      <div className="dv-spec-panels">
      {screens.map((screen, i) => (
        <div key={screen.id} id={`spec-panel-${screen.id}`} className="dv-spec-panel" role={screens.length > 1 ? "tabpanel" : undefined} aria-labelledby={screens.length > 1 ? `spec-tab-${screen.id}` : undefined} data-on={i === current || undefined}>
          <div className="dv-spec-shot">
            <Image src={withBase(screen.src)} alt={screen.alt} width={2160} height={1350} sizes="(min-width: 72rem) 70vw, 100vw" />
            {screen.pins.map(([x, y], n) => (
              <span key={n} className="dv-spec-pin" data-lit={lit === n || undefined} aria-hidden="true" style={{ left: `${x}%`, top: `${y}%` }} onPointerEnter={() => setLit(n)} onPointerLeave={() => setLit(null)}>{n + 1}</span>
            ))}
          </div>
          <div className="dv-spec-side">
            <p className="dv-spec-purpose">{screen.purpose}</p>
            <div className="dv-spec-parts" role="tablist" onKeyDown={(event) => arrows(event, part, parts.length, setPart, partTabs.current)}>
              {parts.map((label, p) => (
                <button key={label} ref={(el) => { if (i === current) partTabs.current[p] = el; }} id={`spec-part-${screen.id}-${p}`} type="button" role="tab" aria-selected={p === part} aria-controls={`spec-sub-${screen.id}-${p}`} tabIndex={p === part ? 0 : -1} onClick={() => setPart(p)}>{label}</button>
              ))}
            </div>
            <div className="dv-spec-subs">
              {[0, 1].map((column) => (
                <div key={column} id={`spec-sub-${screen.id}-${column}`} className="dv-spec-sub" role="tabpanel" aria-labelledby={`spec-part-${screen.id}-${column}`} data-on={part === column || undefined}>
                  <h4 className="dv-spec-sub-title">{parts[column]}</h4>
                  <ol className="dv-spec-rows">
                    {screen.rows.map(([name, does, state], n) => (column === 0 || state !== "-") && (
                      <li key={name} data-lit={lit === n || undefined} onPointerEnter={() => setLit(n)} onPointerLeave={() => setLit(null)}>
                        <b aria-hidden="true">{n + 1}</b>
                        <div>
                          <h4>{name}</h4>
                          <p>{column === 0 ? does : state}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <div id={`spec-sub-${screen.id}-2`} className="dv-spec-sub dv-spec-detail" role="tabpanel" aria-labelledby={`spec-part-${screen.id}-2`} data-on={part === 2 || undefined}>
                <h4 className="dv-spec-sub-title">{spec.labels.accept}</h4>
                <ul>{screen.accept.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div id={`spec-sub-${screen.id}-3`} className="dv-spec-sub dv-spec-detail" role="tabpanel" aria-labelledby={`spec-part-${screen.id}-3`} data-on={part === 3 || undefined}>
                <h4>{spec.labels.tokens}</h4>
                <ul>{screen.tokens.map((item) => <li key={item}>{tokenText(item)}</li>)}</ul>
                <h4>{spec.labels.code}</h4>
                <ul>{screen.code.map(([label, href]) => <li key={href}><a className="link" href={href} target="_blank" rel="noreferrer"><code>{label}</code> ↗</a></li>)}</ul>
                <p className="dv-spec-shared">{spec.shared}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
      <p className="dv-spec-note">{spec.open}</p>
    </div>
  );
}
