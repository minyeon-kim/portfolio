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

type Feature = { kicker: string; title: string; body: string; points: string[]; src: string; width?: number; height?: number; alt?: string; areas: Box[] };

// One way into the live prototype for the whole Deliver section, in the site's language.
export function PrototypeLink({ label }: { label: string }) {
  const locale = useLocale();
  return <a className="dv-prototype-link press" href={devsignUrl(locale)} target="_blank" rel="noreferrer">{label}</a>;
}

// Deliver as a demo reel (class feedback: the screens were too small and the
// reader didn't know where to look). One large screen plays by itself while it
// is on screen: each feature opens on the whole screen, then zooms into its
// three areas one after another, and a bar under its tab fills until the next
// feature takes over. Tabs pick a feature; hovering or focusing the demo pauses
// it. With reduced motion nothing plays or zooms: the tabs and the boxed areas
// do the work.
const OVERVIEW_MS = 1600;
const POINT_MS = 2600;
const FEATURE_MS = OVERVIEW_MS + POINT_MS * 3;

// Zoom so the box fills about half the frame (at most 1.8x), centred, without
// showing past the image edge. --s lets the boxes keep their stroke width.
function zoomTo(b: Box | null): React.CSSProperties {
  if (!b) return { transform: "translate(0%, 0%) scale(1)", "--s": 1 } as React.CSSProperties;
  const s = Math.min(1.8, Math.max(1, 45 / Math.max(b[2], b[3])));
  const clamp = (v: number) => Math.min(0, Math.max(100 - 100 * s, v));
  const tx = clamp(50 - (b[0] + b[2] / 2) * s);
  const ty = clamp(50 - (b[1] + b[3] / 2) * s);
  return { transform: `translate(${tx}%, ${ty}%) scale(${s})`, "--s": s } as React.CSSProperties;
}

export function DeliverShow({ features, labels }: { features: Feature[]; labels: { play: string; pause: string } }) {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 64rem)");
    const sync = () => { setStill(motion.matches); setLinked(wide.matches && !motion.matches); };
    sync();
    motion.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); motion.removeEventListener("change", sync); wide.removeEventListener("change", sync); };
  }, []);

  // One position across all features (ms). Autoplay adds time; on wide
  // screens scrolling through the pinned track also moves it (class
  // feedback: zoom and move just by scrolling), forwards or back.
  const total = FEATURE_MS * features.length;
  const pos = useRef(0);
  const apply = useCallback(() => {
    const i = Math.min(features.length - 1, Math.floor(pos.current / FEATURE_MS));
    setActive(i);
    setElapsed(pos.current - i * FEATURE_MS);
  }, [features.length]);

  const playing = visible && !held && !paused && !still;
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      pos.current = (pos.current + Math.min(100, now - last)) % total; // a hidden tab pauses frames; never skip ahead
      last = now;
      apply();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, total, apply]);

  useEffect(() => {
    if (!linked) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY, dy = y - lastY;
      lastY = y;
      const el = track.current, show = root.current;
      if (!el || !show) return;
      const box = el.getBoundingClientRect();
      const travel = box.height - show.offsetHeight;
      const top = parseFloat(getComputedStyle(show).top) || 0;
      if (travel <= 0 || box.top > top || box.bottom < show.offsetHeight + top) return; // only while pinned
      pos.current = Math.max(0, Math.min(total - 1, pos.current + dy * (total / travel)));
      apply();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [linked, total, apply]);

  const pick = (i: number) => { pos.current = i * FEATURE_MS; apply(); };
  const point = still ? -1 : elapsed < OVERVIEW_MS ? -1 : Math.min(2, Math.floor((elapsed - OVERVIEW_MS) / POINT_MS));
  const f = features[active];

  return (
    <div ref={track} className="dv-show-track" data-linked={linked || undefined}>
    <div ref={root} className="dv-show" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="dv-show-screen">
        {features.map((feature, i) => (
          <div key={feature.title} className="dv-show-shot" data-on={i === active || undefined} aria-hidden={i !== active}>
            <div className="dv-show-zoom" data-zoomed={i === active && point >= 0 || undefined} style={i === active ? zoomTo(point >= 0 ? feature.areas[point] : null) : undefined}>
              <Image src={withBase(feature.src)} alt={feature.alt ?? ""} width={feature.width ?? 1280} height={feature.height ?? 800} sizes="(max-width: 1023px) 100vw, 1200px" loading="eager" />
              <Areas boxes={feature.areas} current={i === active ? point : -1} />
            </div>
          </div>
        ))}
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
              <span style={{ transform: `scaleX(${i < active ? 1 : i === active ? (still ? 1 : elapsed / FEATURE_MS) : 0})` }} />
            </span>
            <span className="dv-show-tab-num">{pad(i + 1)}</span>
            <span className="dv-show-tab-name">{feature.title}</span>
          </button>
        ))}
      </div>
      <div className="dv-show-text" role="tabpanel" aria-live="polite">
        <p className="dv-story-kicker">{f.kicker}</p>
        <p className="dv-show-body">{f.body}</p>
        <ol className="dv-show-points">
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
