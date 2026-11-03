"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

// Boards too dense to read at column width: with a mouse the frame stays put and the
// image magnifies around the cursor, following it. Touch and keyboard open the full image.
export function ZoomFrame({ children, href, scale = 3 }: { children: React.ReactNode; href: string; scale?: number }) {
  const locale = useLocale();
  const follow = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--zx", `${((event.clientX - box.left) / box.width) * 100}%`);
    event.currentTarget.style.setProperty("--zy", `${((event.clientY - box.top) / box.height) * 100}%`);
    event.currentTarget.dataset.on = "";
  };
  return (
    <a
      className="dv-zoom-frame"
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ "--zs": scale } as React.CSSProperties}
      onPointerEnter={follow}
      onPointerMove={follow}
      onPointerLeave={(event) => { delete event.currentTarget.dataset.on; }}
    >
      <div className="dv-zoom-inner">{children}</div>
      <span className="dv-zoom-hint" aria-hidden="true">{locale === "ko" ? "마우스를 올려 확대" : "Hover to magnify"}</span>
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
        <ZoomFrame href={withBase(art.src)} scale={3}>
          <Image src={withBase(art.src)} alt={art.alt} width={art.width} height={art.height} sizes="(max-width: 767px) 100vw, 1200px" />
        </ZoomFrame>
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

// One core feature: the real prototype clip and its one sentence. The list under
// the sentence follows the clip: the point on screen now is lit. With reduced motion
// nothing autoplays and the video shows its controls.
type Reel = { id: string; kicker: string; name: string; body: string; alt?: string; points: string[]; clip: { src: string; poster: string; marks: number[] }; solves?: React.ReactNode };
function FeatureReel({ reel, on, shown, pinned, playing }: { reel: Reel; on: boolean; shown: boolean; pinned: boolean; playing: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [point, setPoint] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(motion.matches);
    if (motion.matches) return;
    el.playbackRate = PLAYBACK_RATE;
    if (pinned) {
      if (playing) el.play().catch(() => {});
      else el.pause();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinned, playing]);
  const sync = () => {
    const t = video.current?.currentTime ?? 0;
    setPoint(reel.clip.marks.reduce((at, mark, i) => (t >= mark ? i : at), 0));
  };
  return (
    <li id={reel.id} className="dv-reel dv-link-target" data-on={on || undefined} data-shown={shown || undefined}>
      <div className="dv-reel-media">
        <video ref={video} src={withBase(reel.clip.src)} poster={withBase(reel.clip.poster)} muted loop playsInline preload="none" controls={still} aria-label={reel.alt ?? reel.name} onTimeUpdate={sync} />
      </div>
      <div className="dv-reel-text">
        <p className="dv-reel-name"><b>{reel.kicker.split(" ")[0]}</b>{reel.name}<span>{reel.kicker.split(" ").slice(1).join(" ")}</span></p>
        <h4 className="dv-reel-line">{reel.body}</h4>
        <ol className="dv-reel-points">
          {reel.points.map((text, i) => <li key={text} data-on={i === point || undefined}>{text}</li>)}
        </ol>
        {reel.solves && <p className="dv-reel-solves">{reel.solves}</p>}
      </div>
    </li>
  );
}

// On desktop the clip stays pinned while the sentences scroll past it, and the clip
// changes as each sentence reaches the middle of the screen. Elsewhere: a plain list.
export function FeatureReels({ reels }: { reels: Reel[] }) {
  const root = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setPinned(wide.matches);
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const el = root.current;
    if (!el || !pinned) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let next = 0;
      el.querySelectorAll(".dv-reel-text").forEach((text, i) => { if (text.getBoundingClientRect().top < mid) next = i; });
      setCurrent(next);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pinned]);
  return (
    <ul ref={root} className="dv-reels dv-gap-40">
      {reels.map((reel, i) => <FeatureReel key={reel.id} reel={reel} on={i === current} shown={i <= current} pinned={pinned} playing={onScreen && i === current} />)}
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

type Problem = { title: string; body: string; role: string; tone: string; feature?: string };

// Key problems as a horizontal accordion: one panel open (hover, focus or tap),
// the others keep their number and name. Stacked and all open below 64rem.
export function ProblemPanels({ items, answeredBy }: { items: Problem[]; answeredBy: string }) {
  const [open, setOpen] = useState(0);
  return (
    <ol className="dv-panels dv-gap-40 reveal">
      {items.map((item, i) => (
        <li key={item.title} data-tone={item.tone} data-on={i === open || undefined} onMouseEnter={() => setOpen(i)}>
          <button type="button" aria-expanded={i === open} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
            <span className="dv-panel-who"><b>{pad(i + 1)}</b></span>
            <h4>{item.title}</h4>
          </button>
          <div className="dv-panel-more">
            <div>
              <p>{item.body}</p>
              {item.feature && <p className="dv-panel-answer"><span>{answeredBy}</span><b>{item.feature}</b></p>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

