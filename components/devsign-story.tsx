"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { devsignUrl, withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1.15;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

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
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 0;
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
        <Image src={withBase(art.src)} alt={art.alt} width={art.width} height={art.height} sizes="(max-width: 767px) 100vw, 1200px" />
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
      <CropPair before={before} after={after} a={before.box} b={after.box} lines={[before.text, after.text]} labels={labels} tile={2.15} />
    </div>
  );
}

// Affinity as a pinned scene: the page stays and, with native scroll, every quote (one
// dot) gathers into its theme and then into its problem. Only drawn on wide screens with
// motion allowed (CSS); otherwise the case shows a plain list instead.
type DotGroup = { name: string; count: number; problem: number; tone?: string };
const DOT_W = 1200;
const DOT_H = 460;
const DOT_BASE = 340;
const DOT_CELL = 28;
const PROBLEM_X = [0, 320, 640, 960];
function dotLayout(groups: DotGroup[]) {
  const total = groups.reduce((sum, g) => sum + g.count, 0);
  const inProblem = [0, 0, 0, 0];
  let index = 0;
  return groups.flatMap((g, column) => Array.from({ length: g.count }, (_, n) => {
    // A fixed shuffle, so the first screen reads as one unsorted crowd.
    const at = ((index + 1) * 73) % total;
    const spread = ((index + 1) * 37) % 100 / 100;
    index += 1;
    const x1 = column * (DOT_W / 7) + 9 + (n % 5) * DOT_CELL;
    const y1 = DOT_BASE - 9 - Math.floor(n / 5) * DOT_CELL;
    const p = g.problem >= 0 ? inProblem[g.problem]++ : 0;
    return {
      tone: g.tone, other: g.problem < 0, spread,
      x0: 17 + (at % 34) * 34.8, y0: 70 + Math.floor(at / 34) * 34.8,
      x1, y1,
      x2: g.problem >= 0 ? PROBLEM_X[g.problem] + 9 + (p % 8) * DOT_CELL : x1,
      y2: g.problem >= 0 ? DOT_BASE - 9 - Math.floor(p / 8) * DOT_CELL : y1,
    };
  }));
}
const dotEase = (t: number) => { const v = Math.max(0, Math.min(1, t)); return v * v * (3 - 2 * v); };
export function AffinityDots({ groups, problems, funnel, note }: { groups: DotGroup[]; problems: { title: string; tone: string }[]; funnel: [string, string][]; note: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const dots = dotLayout(groups);
  useEffect(() => {
    const el = track.current;
    if (!el || !window.matchMedia("(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)").matches) return;
    const circles = el.querySelectorAll("circle");
    const art = el.querySelector("svg");
    const layout = dotLayout(groups);
    let frame = 0;
    let last = "";
    const read = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -box.top / (box.height - window.innerHeight)));
      const a = (p - 0.1) / 0.34;
      const b = (p - 0.56) / 0.34;
      const key = `${dotEase(a).toFixed(3)}:${dotEase(b).toFixed(3)}`;
      setStep(p < 0.27 ? 0 : p < 0.73 ? 1 : 2);
      if (key === last) return;
      last = key;
      circles.forEach((circle, i) => {
        const d = layout[i];
        const u = dotEase((a - d.spread * 0.2) / 0.8);
        const w = dotEase((b - d.spread * 0.2) / 0.8);
        const x = d.x0 + (d.x1 - d.x0) * u + (d.x2 - d.x1) * w;
        const y = d.y0 + (d.y1 - d.y0) * u + (d.y2 - d.y1) * w;
        circle.setAttribute("cx", x.toFixed(1));
        circle.setAttribute("cy", y.toFixed(1));
        if (d.other) circle.setAttribute("opacity", Math.max(0, 1 - w * 2.5).toFixed(2));
      });
      art?.toggleAttribute("data-colored", a > 0.3);
      el.style.setProperty("--l1", (dotEase(a * 1.4 - 0.4) * (1 - dotEase(b * 3))).toFixed(2));
      el.style.setProperty("--l2", dotEase(b * 2 - 1).toFixed(2));
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
  }, [groups]);
  return (
    <div ref={track} className="dv-dots-track">
      <div className="dv-dots-stage">
        <ol className="dv-funnel">
          {funnel.map(([n, label], i) => <li key={label} data-on={i === step || undefined}><strong>{n}</strong><span>{label}</span></li>)}
        </ol>
        <div className="dv-dots-art" aria-hidden="true">
          <svg viewBox={`0 0 ${DOT_W} ${DOT_H}`}>
            {dots.map((d, i) => <circle key={i} cx={d.x0} cy={d.y0} r="9" data-tone={d.tone} />)}
          </svg>
          {groups.map((g, i) => (
            <p key={g.name} className="dv-dots-theme" style={{ left: `${(i / 7) * 100}%`, top: `${((DOT_BASE + 14) / DOT_H) * 100}%` }}>{g.name} <b>{g.count}</b></p>
          ))}
          {problems.map((item, i) => (
            <p key={item.title} className="dv-dots-problem" data-tone={item.tone} style={{ left: `${(PROBLEM_X[i] / DOT_W) * 100}%`, top: `${((DOT_BASE + 14) / DOT_H) * 100}%` }}><b>{String(i + 1).padStart(2, "0")}</b>{item.title}</p>
          ))}
        </div>
        <p className="dv-dots-note" data-on={step === 2 || undefined}>{note}</p>
        <ul className="sr-only">
          {groups.map((g) => <li key={g.name}>{g.name}: {g.count}{g.problem >= 0 ? ` → ${problems[g.problem].title}` : ""}</li>)}
        </ul>
      </div>
    </div>
  );
}

// The key problems as a horizontal accordion: four panels in a row, one open. Hover,
// keyboard focus or a tap opens a panel; on phones (CSS) they are all open and stacked.
type Problem = { title: string; body: string; role: string; tone: string; feature?: string };
export function ProblemPanels({ items, answeredBy }: { items: Problem[]; answeredBy: string }) {
  const [open, setOpen] = useState(0);
  return (
    <ol className="dv-panels dv-gap-40 reveal">
      {items.map((item, i) => (
        <li key={item.title} data-tone={item.tone} data-on={i === open || undefined} onMouseEnter={() => setOpen(i)}>
          <button type="button" aria-expanded={i === open} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
            <span className="dv-panel-who"><b>{pad(i + 1)}</b>{item.role}</span>
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

// The opener's "walk through the prototype" link opens the same demo over the page,
// so nobody is thrown 18,000px down a case they haven't read: a native modal (Esc,
// focus kept inside and returned to the link), and closing leaves them where they
// were. Without JavaScript, or before the case has mounted, the link still scrolls to #try.
export function DemoDialog({ close, ...demo }: DemoProps & { close: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href="#try"]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setLabel(link.textContent);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => {
    if (label !== null && !dialog.current?.open) dialog.current?.showModal();
  }, [label]);
  return (
    <dialog ref={dialog} className="dv-demo-dialog" aria-label={label ?? undefined} onClose={() => setLabel(null)} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      {label !== null && (
        <div className="dv-demo-dialog-body">
          <form method="dialog"><button type="submit" className="dv-demo-close" aria-label={close}><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></form>
          <GuidedDemo {...demo} />
        </div>
      )}
    </dialog>
  );
}

// The prototype as a short guided walk-through: real screenshots with everything but
// the part that matters dimmed, and one line saying what is happening. Next (or the
// highlighted control) moves on, so nobody has to hunt for where to press. The free
// prototype is one link away for whoever wants it.
type DemoStep = { src: string; box: Box; focus?: Box; tipAt?: Box; text: string };
type DemoProps = { steps: DemoStep[]; chapters: { label: string; from: number }[]; alt: string; next: string; back: string; restart: string; open: string };
export function GuidedDemo({ steps, chapters, alt, next, back, restart, open }: DemoProps) {
  const locale = useLocale();
  const [at, setAt] = useState(0);
  const step = steps[at];
  const last = at === steps.length - 1;
  const [x, y, w, h] = step.box;
  const [fx, fy, fw, fh] = step.focus ?? step.box;
  // The tip sits beside the bright area, on the side with room.
  const [ax, ay, aw, ah] = step.tipAt ?? [fx, fy, fw, fh];
  const onLeft = ax + aw / 2 > 50;
  const place = {
    "--tl": onLeft ? "auto" : `calc(${ax + aw}% + 16px)`,
    "--tr": onLeft ? `calc(${100 - ax}% + 16px)` : "auto",
    "--tt": ay + ah / 2 < 50 ? `max(16px, ${ay}%)` : "auto",
    "--tb": ay + ah / 2 < 50 ? "auto" : `max(16px, ${100 - ay - ah}%)`,
    "--tw": `calc(${onLeft ? ax : 100 - ax - aw}% - 32px)`,
  } as React.CSSProperties;
  return (
    <div className="dv-demo">
      <ol className="dv-demo-chapters">
        {chapters.map((chapter, i) => {
          const end = chapters[i + 1]?.from ?? steps.length;
          const fill = Math.max(0, Math.min(1, (at + 1 - chapter.from) / (end - chapter.from)));
          return (
            <li key={chapter.label}>
              <button type="button" aria-current={at >= chapter.from && at < end ? "step" : undefined} onClick={() => setAt(chapter.from)}>
                <i aria-hidden="true"><b style={{ transform: `scaleX(${fill})` }} /></i>
                {chapter.label}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="dv-demo-stage">
        <div className="dv-demo-screen">
          {steps.map((s, i) => Math.abs(i - at) <= 1 && (
            <Image key={s.src} src={withBase(s.src)} alt={i === at ? alt : ""} width={1920} height={1200} sizes="(max-width: 767px) 100vw, 1200px" loading="eager" data-on={i === at || undefined} />
          ))}
          <span className="dv-demo-focus" style={{ left: `${fx}%`, top: `${fy}%`, width: `${fw}%`, height: `${fh}%` }} aria-hidden="true" />
          {!last && <button key={at} type="button" className="dv-demo-spot" style={{ left: `${x + w / 2}%`, top: `${y + h / 2}%`, width: `${w}%`, height: `${h}%` }} aria-label={next} onClick={() => setAt(at + 1)} />}
        </div>
        <div className="dv-demo-tip" style={place} aria-live="polite">
          <p key={at} className="dv-demo-line"><span className="dv-demo-count">{at + 1} / {steps.length}</span>{step.text}</p>
          <div className="dv-demo-actions">
            {at > 0 && !last && <button type="button" onClick={() => setAt(at - 1)}>{back}</button>}
            {!last && <button type="button" data-primary="" onClick={() => setAt(at + 1)}>{next}</button>}
            {last && <button type="button" onClick={() => setAt(0)}>{restart}</button>}
            {last && <a href={devsignUrl(locale)} target="_blank" rel="noreferrer" data-primary="">{open}</a>}
          </div>
        </div>
      </div>
      <a className="dv-demo-open" href={devsignUrl(locale)} target="_blank" rel="noreferrer">{open}</a>
    </div>
  );
}
