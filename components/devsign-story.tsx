"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { devsignUrl } from "@/components/devsign-live";
import { withBase } from "@/lib/site";
import { useLocale } from "@/lib/use-locale";

// Scroll stories after the Figma "Deliver · scroll story" and "Testing ·
// iteration story" sections: one screen stays put (sticky) while the list
// beside it scrolls; the item crossing the middle of the viewport becomes
// active and the screen crossfades to it, with its areas boxed and numbered.
// The page's own scroll drives it (IntersectionObserver), nothing is hijacked.
// Below 64rem the screen sits above the list (or inside each item) and every
// item is open.

type Box = [number, number, number, number];
const pad = (n: number) => String(n).padStart(2, "0");
const boxStyle = (b: Box) => ({ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` });

// The index of the list item that crosses the middle band of the viewport.
function useActiveItem(count: number) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { rootMargin: "-45% 0px -45% 0px" });
    items.current.slice(0, count).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);
  return { active, items };
}

function Areas({ boxes, current, onPick }: { boxes: Box[]; current: number; onPick?: (i: number) => void }) {
  return (
    <>
      {boxes.map((b, i) => (
        <span key={i} className="dv-story-area" data-on={i === current || undefined} style={boxStyle(b)} onMouseEnter={onPick && (() => onPick(i))}>
          <b>{i + 1}</b>
        </span>
      ))}
    </>
  );
}

function Progress({ count, active }: { count: number; active: number }) {
  return (
    <ol className="dv-story-progress" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <li key={i} data-on={i <= active || undefined} />)}
    </ol>
  );
}

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

export function IterationStory({ before, after, changes, labels }: { before: Shot; after: Shot; changes: Change[]; labels: { asIs: string; toBe: string } }) {
  const { active, items } = useActiveItem(changes.length);
  const [view, setView] = useState<"a" | "b">("b");
  const views = [["a", labels.asIs, before], ["b", labels.toBe, after]] as const;

  return (
    <div className="dv-story dv-story-iteration">
      <div className="dv-story-stage">
        <div className="dv-story-screen dv-story-screen-wide">
          {views.map(([key, , img]) => (
            <div key={key} className="dv-story-shot" data-on={view === key || undefined} aria-hidden={view !== key}>
              <Image src={withBase(img.src)} alt={img.alt ?? ""} width={2880} height={1620} sizes="(max-width: 1023px) 100vw, 720px" />
              <Areas boxes={changes.map((c) => c[key])} current={active} />
            </div>
          ))}
          <div className="dv-story-switch" role="group" aria-label={`${labels.asIs} / ${labels.toBe}`}>
            {views.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}>{label}</button>
            ))}
          </div>
        </div>
        <p className="dv-story-caption">{view === "b" ? <><strong>{after.lead}</strong>{after.text}</> : before.text}</p>
        <Progress count={changes.length} active={active} />
      </div>
      <ol className="dv-story-list">
        {changes.map((c, i) => (
          <li key={c.title} ref={(el) => { items.current[i] = el; }} data-index={i} data-on={i === active || undefined} className="dv-story-item">
            <h4 className="dv-story-name dv-story-change"><b>{i + 1}</b>{c.title}</h4>
            <div className="dv-story-detail">
              <p className="dv-story-before"><span className="dv-story-tag">{labels.asIs}</span>{c.before}</p>
              <p className="dv-story-after"><span className="dv-story-tag">{labels.toBe}</span>{c.after}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
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
