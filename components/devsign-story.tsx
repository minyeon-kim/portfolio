"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

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

// Scroll-driven steps, the usual pinned pattern: the stage stays on screen (CSS
// sticky) and each change crossfades in place as the page scrolls. Native scroll
// only. On phones and with reduced motion (CSS) the steps are a plain list.
export function IterationCompare({ before, after, changes, labels }: { before: Shot; after: Shot; changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const stage = (el.firstElementChild as HTMLElement).offsetHeight;
      // The stage is only as tall as its content and pins centred on the screen.
      const top = Math.max(24, (window.innerHeight - stage) / 2);
      const travel = box.height - stage;
      const progress = travel > 0 ? Math.min(1, Math.max(0, (top - box.top) / travel)) : 0;
      el.style.setProperty("--stage-top", `${top}px`);
      el.style.setProperty("--p", String(progress));
      setActive(Math.min(changes.length - 1, Math.floor(progress * changes.length)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [changes.length]);
  return (
    <div ref={root} className="dv-iter" style={{ "--n": changes.length } as React.CSSProperties}>
      <div className="dv-iter-stage">
        <ol className="dv-iter-progress" aria-hidden="true">
          {changes.map((c, i) => (
            <li key={c.title} data-on={i === active || undefined} style={{ "--i": i } as React.CSSProperties}><b>{i + 1}</b>{c.title}</li>
          ))}
        </ol>
        <ol className="dv-iter-steps">
          {changes.map((c, i) => (
            <li key={c.title} data-on={i === active || undefined}>
              <h4 className="dv-iter-name"><b>{i + 1}</b>{c.title}</h4>
              <CropPair before={before} after={after} a={c.a} b={c.b} lines={[c.before, c.after]} labels={labels} />
            </li>
          ))}
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
function FeatureReel({ reel }: { reel: Reel }) {
  const video = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);
  const [refused, setRefused] = useState(false);
  const [near, setNear] = useState(false);
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
    let wanted = false;
    const start = () => {
      if (!wanted) return;
      el.muted = true;
      el.play().catch((error: Error) => { if (error.name === "NotAllowedError") setRefused(true); });
    };
    // Coming back to the tab, or the first press, gets another try.
    const retry = () => { if (el.paused) start(); };
    const onVisible = () => { if (document.visibilityState === "visible") retry(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("keydown", retry);
    const onScreen = new IntersectionObserver(([entry]) => {
      wanted = entry.isIntersecting;
      if (wanted) start();
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
  return (
    <li id={reel.id} className="dv-reel dv-link-target">
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
      <div className="dv-reel-media">
        <video ref={video} src={withBase(reel.clip.src)} poster={withBase(reel.clip.poster)} muted loop playsInline preload={near ? "auto" : "none"} controls={still || refused} aria-label={reel.alt ?? reel.name} onPlaying={() => setRefused(false)} />
      </div>
    </li>
  );
}

// Each feature is its own section: what it does, then its clip across the column,
// which plays while it is on screen.
export function FeatureReels({ reels }: { reels: Reel[] }) {
  return (
    <ul className="dv-reels dv-gap-40">
      {reels.map((reel) => <FeatureReel key={reel.id} reel={reel} />)}
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

type Problem = { title: string; body: string; feature?: string };

// Key problems as one table: the problem is what you read, one sentence explains it, and the
// feature that answers it is the only colour. Every row stays lit; nothing depends on scroll.
export function ProblemPanels({ items, answeredBy, children }: { items: Problem[]; answeredBy: string; children?: React.ReactNode }) {
  return (
    <div className="dv-panels-wrap">
      {children}
      <div className="dv-panels-table reveal">
        <p className="dv-panels-col" aria-hidden="true">{answeredBy}</p>
        <ol className="dv-panels">
          {items.map((item, i) => (
            <li key={item.title}>
              <b className="dv-panel-num">{pad(i + 1)}</b>
              <div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
              {item.feature && <p className="dv-panel-answer"><span className="sr-only">{answeredBy}: </span><ArrowIcon size={18} />{item.feature}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

type SpecScreen = { id: string; tab: string; alt: string; src: string; rows: [string, string, string][]; pins: [number, number][] };
type SpecData = { shared: string; open: string; screens: SpecScreen[]; only?: string; more?: string; moreHref?: string };

// The handoff spec: one key screen at a time, numbered pins on the real screen and the same
// numbers in the list beside it. Pointing at either lights the other. Phones list all four.
export function HandoffSpec({ spec, one = false }: { spec: SpecData; one?: boolean }) {
  const screens = one ? spec.screens.filter((screen) => screen.id === spec.only) : spec.screens;
  const [current, setCurrent] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pick = (i: number) => { setCurrent(i); setLit(null); };
  const onKey = (event: React.KeyboardEvent) => {
    const last = screens.length - 1;
    const next = { ArrowRight: current === last ? 0 : current + 1, ArrowLeft: current === 0 ? last : current - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    pick(next);
    tabs.current[next]?.focus();
  };
  return (
    <div className="dv-spec dv-gap-40 reveal">
      {screens.length > 1 && <div className="dv-spec-tabs" role="tablist" onKeyDown={onKey}>
        {screens.map((screen, i) => (
          <button key={screen.id} ref={(el) => { tabs.current[i] = el; }} id={`spec-tab-${screen.id}`} type="button" role="tab" aria-selected={i === current} aria-controls={`spec-panel-${screen.id}`} tabIndex={i === current ? 0 : -1} onClick={() => pick(i)}>{screen.tab}</button>
        ))}
      </div>}
      <div className="dv-spec-panels">
      {screens.map((screen, i) => (
        <div key={screen.id} id={`spec-panel-${screen.id}`} className="dv-spec-panel" role={screens.length > 1 ? "tabpanel" : undefined} aria-labelledby={screens.length > 1 ? `spec-tab-${screen.id}` : undefined} data-on={i === current || undefined}>
          <div className="dv-spec-shot">
            <Image src={withBase(screen.src)} alt={screen.alt} width={2160} height={1350} sizes="(min-width: 72rem) 60vw, 100vw" />
            {screen.pins.map(([x, y], n) => (
              <span key={n} className="dv-spec-pin" data-lit={lit === n || undefined} aria-hidden="true" style={{ left: `${x}%`, top: `${y}%` }} onPointerEnter={() => setLit(n)} onPointerLeave={() => setLit(null)}>{n + 1}</span>
            ))}
          </div>
          <ol className="dv-spec-rows">
            {screen.rows.map(([name, does, state], n) => (
              <li key={name} data-lit={lit === n || undefined} onPointerEnter={() => setLit(n)} onPointerLeave={() => setLit(null)}>
                <b aria-hidden="true">{n + 1}</b>
                <div>
                  <h4>{name}</h4>
                  <p>{does}</p>
                  {state !== "-" && <p className="dv-spec-state">{state}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
      </div>
      <p className="dv-spec-note">{spec.shared}</p>
      <p className="dv-spec-note">{spec.open}</p>
      {one && spec.more && spec.moreHref && <p className="dv-spec-more"><Link className="link" href={spec.moreHref}>{spec.more} →</Link></p>}
    </div>
  );
}
