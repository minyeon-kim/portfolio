"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { crop } from "@/components/devsign-compare";
import { devsignUrl } from "@/components/devsign-live";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

type Feature = { kicker: string; title: string; body: string; points: string[]; src: string; width?: number; height?: number; alt?: string; areas: Box[]; clip: { src: string; poster: string; marks: number[] } };

// One way into the live prototype for the whole Deliver section, in the site's language.
export function PrototypeLink({ label }: { label: string }) {
  const locale = useLocale();
  return <a className="dv-prototype-link press" href={devsignUrl(locale)} target="_blank" rel="noreferrer">{label}</a>;
}

// The Deliver demo: real recordings of the live prototype, one short clip per
// feature (captured at 2x with zooms applied in the page, so text stays sharp).
// The current point sits on the screen as a caption, timed by the clip's `marks`;
// a bar under each tab fills as its clip plays and the next feature takes over.
// Plays only while on screen; with reduced motion nothing autoplays: the video
// shows its controls and the points are listed below it.
const PLAYBACK_RATE = 1.15;
export function DeliverShow({ features, labels }: { features: Feature[]; labels: { play: string; pause: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); motion.removeEventListener("change", sync); };
  }, []);

  const playing = visible && !paused && !still;
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.playbackRate = PLAYBACK_RATE;
    if (!playing) { el.pause(); return; }
    el.play().catch(() => {});
    let frame = requestAnimationFrame(function tick() {
      if (el.duration) setProgress(el.currentTime / el.duration);
      setTime(el.currentTime);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, active]);

  const pick = (i: number) => { setActive(i); setProgress(0); setTime(0); };
  const f = features[active];
  const point = still ? -1 : f.clip.marks.reduce((at, mark, i) => (time >= mark ? i : at), -1);

  return (
    <div className="dv-show-track">
    <div ref={root} className="dv-show">
      <div className="dv-show-screen">
        <video key={f.clip.src} ref={video} src={withBase(f.clip.src)} poster={withBase(f.clip.poster)} muted playsInline preload="auto" controls={still} aria-label={f.alt ?? f.title} onEnded={() => pick((active + 1) % features.length)} />
        {point >= 0 && (
          <p key={`${active}-${point}`} className="dv-show-caption">
            <b>{point + 1}</b>{f.points[point]}
          </p>
        )}
        {!still && (
          <button type="button" className="dv-show-toggle" onClick={() => setPaused((p) => !p)} aria-label={paused ? labels.play : labels.pause}>
            {paused ? "▶" : "❚❚"}
          </button>
        )}
      </div>
      <div className="dv-show-tabs" role="tablist">
        {features.map((feature, i) => (
          <button key={feature.title} type="button" role="tab" aria-selected={i === active} className="dv-show-tab" onClick={() => pick(i)}>
            <span className="dv-show-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${i < active ? 1 : i === active ? (still ? 1 : progress) : 0})` }} />
            </span>
            <span className="dv-show-tab-num">{pad(i + 1)}</span>
            <span className="dv-show-tab-name">{feature.title}</span>
            <span className="dv-show-tab-role">{feature.kicker.split(" · ").slice(1).join(" · ")}</span>
          </button>
        ))}
      </div>
      <div className="dv-show-text" role="tabpanel">
        <p className="dv-show-body">{f.body}</p>
        <ol className="dv-show-points" data-still={still || undefined}>
          {f.points.map((p, j) => (
            <li key={p} data-on={j === point || undefined}><b>{j + 1}</b>{p}</li>
          ))}
        </ol>
      </div>
    </div>
    </div>
  );
}


type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

// One change of an iteration at a time: the changed area of the As-is and To-be
// screens as large close-ups side by side. Picking another change pans both
// screenshots to it (same image, so nothing reloads).
export function IterationCompare({ before, after, changes, labels }: { before: Shot; after: Shot; changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const change = changes[active];
  const sides = [
    { key: "a", tag: labels.asIs, img: before, box: change.a, line: change.before },
    { key: "b", tag: labels.toBe, img: after, box: change.b, line: change.after },
  ] as const;
  const onKey = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + changes.length) % changes.length;
    setActive(next);
    tabs.current[next]?.focus();
  };
  return (
    <div className="dv-iter">
      <div className="dv-iter-tabs" role="tablist" onKeyDown={onKey}>
        {changes.map((c, i) => (
          <button key={c.title} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" aria-selected={i === active} tabIndex={i === active ? 0 : -1} className="dv-iter-tab" onClick={() => setActive(i)}>
            <b>{i + 1}</b><span>{c.title}</span>
          </button>
        ))}
      </div>
      <p className="dv-iter-title">{change.title}</p>
      <div className="dv-iter-pair" role="tabpanel">
        {sides.map(({ key, tag, img, box, line }) => {
          const view = crop(box);
          return (
            <figure key={key} className="dv-iter-side" data-side={key}>
              <div className="dv-iter-view">
                <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 767px) 300vw, 200vw" style={view.img} />
                <span key={active} className="dv-iter-mark" style={view.mark} aria-hidden="true" />
                <span className="dv-iter-tag">{tag}</span>
              </div>
              <figcaption key={active}>{line}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

// One core feature, large: the real prototype clip beside its one sentence. The
// card above the sentence follows the clip through the feature's points, so the
// text moves with the screen. Plays only while it is on screen; with reduced
// motion nothing autoplays and the video shows its controls.
type Reel = { id: string; kicker: string; name: string; body: string; alt?: string; points: string[]; clip: { src: string; poster: string; marks: number[] }; solves?: React.ReactNode };
export function FeatureReel({ reel }: { reel: Reel }) {
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const sync = () => {
    const t = video.current?.currentTime ?? 0;
    setPoint(reel.clip.marks.reduce((at, mark, i) => (t >= mark ? i : at), 0));
  };
  return (
    <li id={reel.id} className="dv-reel reveal dv-link-target">
      <div className="dv-reel-media">
        <video ref={video} src={withBase(reel.clip.src)} poster={withBase(reel.clip.poster)} muted loop playsInline preload="none" controls={still} aria-label={reel.alt ?? reel.name} onTimeUpdate={sync} />
      </div>
      <div className="dv-reel-text">
        <div className="dv-reel-status">
          <p className="dv-reel-name"><i aria-hidden="true" />{reel.name}<span>{reel.kicker}</span></p>
          <p key={point} className="dv-reel-point">{reel.points[point]}</p>
        </div>
        <h4 className="dv-reel-line">{reel.body}</h4>
        {reel.solves && <p className="dv-reel-solves">{reel.solves}</p>}
      </div>
    </li>
  );
}

// The real prototype, usable inside the case (portfolio readers can try the
// product, not just look at it). It loads only when asked: a poster with a
// Start button stands in, so the page doesn't pull in a whole React app up
// front. The prototype is laid out at its desktop width (1440) and scaled to
// the window; clicks map through the scale. Below 64rem it is a link instead
// (the prototype is a desktop tool). The tasks beside it give a first-time
// visitor something to do.
const TRY_WIDTH = 1440;
export function TryPrototype({ poster, posterAlt, start, open, tasksLabel, tasks }: { poster: string; posterAlt: string; start: string; open: string; tasksLabel: string; tasks: string[] }) {
  const locale = useLocale();
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const scale = rect.width / TRY_WIDTH;
      el.style.setProperty("--try-scale", String(scale));
      el.style.setProperty("--try-h", `${rect.height / scale}px`);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, []);
  const url = devsignUrl(locale);
  return (
    <div className="dv-try">
      <div className="dv-try-window">
        <div className="devsign-hero-chrome dv-try-chrome">
          <span /><span /><span />
          <a href={url} target="_blank" rel="noreferrer">{url.replace(/^https:\/\//, "").replace(/\?.*$/, "")}</a>
        </div>
        <div ref={box} className="dv-try-screen" data-ready={ready || undefined}>
          <Image src={withBase(poster)} alt={posterAlt} width={2880} height={1620} sizes="(max-width: 1023px) 100vw, 1200px" />
          {on && <iframe src={url} title="Devsign prototype" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" onLoad={() => window.setTimeout(() => setReady(true), 600)} />}
          {!ready && (
            <div className="dv-try-cover">
              <button type="button" className="dv-try-start press" onClick={() => setOn(true)} disabled={on} aria-busy={on || undefined}>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
                {start}
              </button>
              <a className="dv-try-open" href={url} target="_blank" rel="noreferrer">{open}</a>
            </div>
          )}
        </div>
      </div>
      <div className="dv-try-tasks">
        <p>{tasksLabel}</p>
        <ol>{tasks.map((t, i) => <li key={t}><b>{pad(i + 1)}</b>{t}</li>)}</ol>
      </div>
    </div>
  );
}
