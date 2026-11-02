"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { crop } from "@/components/devsign-compare";
import { devsignUrl } from "@/components/devsign-live";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1.15;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

// One change of an iteration at a time: the changed area of the As-is and To-be
// screens as large close-ups side by side. Moving to another change pans both
// screenshots to it (same image, so nothing reloads). The changes advance by
// themselves: the bar on the current tab fills (CSS) and its end picks the next
// one. It runs only on screen and holds on hover or keyboard focus; with reduced
// motion the bar has no animation, so nothing advances.
export function IterationCompare({ before, after, changes, labels }: { before: Shot; after: Shot; changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const [active, setActive] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const change = changes[active];
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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
    <div ref={root} className="dv-iter" data-playing={onScreen}>
      <div className="dv-iter-tabs" role="tablist" onKeyDown={onKey}>
        {changes.map((c, i) => (
          <button key={c.title} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" aria-selected={i === active} tabIndex={i === active ? 0 : -1} className="dv-iter-tab" onClick={() => setActive(i)}>
            {i === active && <i className="dv-iter-bar" aria-hidden="true" onAnimationEnd={() => setActive((i + 1) % changes.length)} />}
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
              <span className="dv-iter-tag">{tag}</span>
              <div className="dv-iter-view">
                <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 767px) 300vw, 200vw" style={view.img} />
                <span key={active} className="dv-iter-mark" style={view.mark} aria-hidden="true" />
              </div>
              <figcaption key={active}>{line}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

// A smaller iteration: the two whole screens, one line each.
export function IterationPair({ before, after, labels }: { before: Shot; after: Shot; labels: { asIs: string; toBe: string } }) {
  const sides = [
    { key: "a", tag: labels.asIs, img: before },
    { key: "b", tag: labels.toBe, img: after },
  ] as const;
  return (
    <div className="dv-iter-pair reveal" data-whole="">
      {sides.map(({ key, tag, img }) => (
        <figure key={key} className="dv-iter-side" data-side={key}>
          <span className="dv-iter-tag">{tag}</span>
          <div className="dv-iter-view">
            <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 767px) 100vw, 600px" />
          </div>
          <figcaption>{img.text}</figcaption>
        </figure>
      ))}
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
// (the prototype is a desktop tool). One hint on the cover gives a first-time
// visitor somewhere to start. The opener's link to #try starts it directly.
const TRY_WIDTH = 1440;
export function TryPrototype({ poster, posterAlt, start, open, hint }: { poster: string; posterAlt: string; start: string; open: string; hint: string }) {
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
  // The opener's "Try the prototype" links to #try: arriving there starts it, so
  // nobody has to press Start as well. Wide screens only, and after the scroll
  // has mostly landed so loading the frame doesn't stall it.
  useEffect(() => {
    let timer = 0;
    const arrive = () => {
      if (window.location.hash !== "#try" || !window.matchMedia("(min-width: 64rem)").matches) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOn(true), 900);
    };
    arrive();
    window.addEventListener("hashchange", arrive);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", arrive);
    };
  }, []);
  const url = devsignUrl(locale);
  return (
    <div id="try" className="dv-try">
      <div className="dv-try-window">
        <div ref={box} className="dv-try-screen" data-ready={ready || undefined}>
          <Image src={withBase(poster)} alt={posterAlt} width={2880} height={1620} sizes="(max-width: 1023px) 100vw, 1200px" />
          {on && <iframe src={url} title="Devsign prototype" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" onLoad={() => window.setTimeout(() => setReady(true), 600)} />}
          {!ready && (
            <div className="dv-try-cover">
              <button type="button" className="dv-try-start press" onClick={() => setOn(true)} disabled={on} aria-busy={on || undefined}>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
                {start}
              </button>
              <p className="dv-try-hint">{hint}</p>
              <a className="dv-try-open" href={url} target="_blank" rel="noreferrer">{open}</a>
            </div>
          )}
        </div>
      </div>
      {ready && <a className="dv-try-open-below" href={url} target="_blank" rel="noreferrer">{open}</a>}
    </div>
  );
}
