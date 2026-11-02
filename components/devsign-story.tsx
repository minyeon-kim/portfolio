"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { crop } from "@/components/devsign-compare";
import { devsignUrl, withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");

const PLAYBACK_RATE = 1.15;

type Shot = { src: string; alt?: string; text: string; lead?: string };
type Change = { title: string; before: string; after: string; a: Box; b: Box };

// One As-is / To-be pair, cut down to the part that changed.
function CropPair({ before, after, a, b, lines, labels }: { before: Shot; after: Shot; a: Box; b: Box; lines: [string, string]; labels: { asIs: string; toBe: string } }) {
  const sides = [
    { key: "a", tag: labels.asIs, img: before, box: a, line: lines[0] },
    { key: "b", tag: labels.toBe, img: after, box: b, line: lines[1] },
  ] as const;
  return (
    <div className="dv-iter-pair">
      {sides.map(({ key, tag, img, box, line }) => {
        const view = crop(box);
        return (
          <figure key={key} className="dv-iter-side" data-side={key}>
            <span className="dv-iter-tag">{tag}</span>
            <div className="dv-iter-view">
              <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 767px) 300vw, 200vw" style={view.img} />
              <span className="dv-iter-mark" style={view.mark} aria-hidden="true" />
            </div>
            <figcaption>{line}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

// One change per panel. On desktop (CSS) each panel stays at the top and the next
// rises over it with native scroll; elsewhere they are a plain list.
export function IterationCompare({ before, after, changes, labels }: { before: Shot; after: Shot; changes: Change[]; labels: { asIs: string; toBe: string } }) {
  return (
    <ol className="dv-iter">
      {changes.map((c, i) => (
        <li key={c.title} className="dv-iter-step">
          <h4 className="dv-iter-name"><b>{i + 1}</b>{c.title}</h4>
          <CropPair before={before} after={after} a={c.a} b={c.b} lines={[c.before, c.after]} labels={labels} />
        </li>
      ))}
    </ol>
  );
}

type Area = [number, number, number, number];
type Candidate = { id: string; name: string; kind: string; pain: string; to: string; from: Area; relief: Area };
type CanvasArt = { src: string; width: number; height: number; painArea: Area; reliefArea: Area; alt: string };

// One sticky of the board, cut out at its own box.
function Sticky({ art, area }: { art: CanvasArt; area: Area }) {
  const [x, y, w, h] = area;
  return (
    <span className="dv-vpc-sticky" style={{ "--r": w / h } as React.CSSProperties}>
      <Image src={withBase(art.src)} alt="" width={art.width} height={art.height} sizes="400vw" style={{ width: `${(art.width / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }} />
    </span>
  );
}

// The canvas stays still as one picture. Under it, the key pains beside the exact
// reliever that answers each and the feature it became, all readable at once. The
// other candidates are there for screen readers.
export function CanvasZoom({ art, candidates, keyPairs, painLabel, reliefLabel, featureLabel, overviewLabel }: { art: CanvasArt; candidates: Candidate[]; keyPairs: string[]; painLabel: string; reliefLabel: string; featureLabel: string; overviewLabel: string }) {
  const rows = keyPairs.flatMap((id) => candidates.filter((c) => c.id === id));
  return (
    <div className="dv-vpc">
      <div className="dv-vpc-view reveal">
        <Image src={withBase(art.src)} alt={art.alt} width={art.width} height={art.height} sizes="(max-width: 767px) 100vw, 1200px" />
      </div>
      <p className="dv-vpc-title reveal">{overviewLabel}</p>
      <div className="dv-vpc-pairs">
        <p className="dv-vpc-head" aria-hidden="true"><span>{painLabel}</span><i /><span>{reliefLabel}</span><i /><span>{featureLabel}</span></p>
        {rows.map((c) => (
          <div key={c.id} className="dv-vpc-pair reveal" aria-hidden="true">
            <Sticky art={art} area={c.from} />
            <i>→</i>
            <Sticky art={art} area={c.relief} />
            <i>→</i>
            <b>{c.to}</b>
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {candidates.map((c) => <li key={c.id}>{c.name}: {c.pain} → {c.to}</li>)}
      </ul>
    </div>
  );
}

// A smaller iteration: one pair, the changed part only.
export function IterationPair({ before, after, labels }: { before: Shot & { box: Box }; after: Shot & { box: Box }; labels: { asIs: string; toBe: string } }) {
  return (
    <div className="reveal">
      <CropPair before={before} after={after} a={before.box} b={after.box} lines={[before.text, after.text]} labels={labels} />
    </div>
  );
}

// One core feature, large: the real prototype clip beside its one sentence. The
// list under the sentence follows the clip: the point on screen now is lit. Plays only while it is on screen; with reduced
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
    let visible = false;
    let covered = false;
    const update = () => {
      if (visible && !covered) el.play().catch(() => {});
      else el.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.5 });
    observer.observe(el);
    // A stacked card under the next one stops playing once that card has risen over it.
    const next = el.closest(".dv-reel")?.nextElementSibling;
    const cover = new IntersectionObserver(([entry]) => {
      covered = entry.isIntersecting;
      update();
    }, { rootMargin: "0px 0px -75% 0px" });
    if (next) cover.observe(next);
    return () => {
      observer.disconnect();
      cover.disconnect();
    };
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
