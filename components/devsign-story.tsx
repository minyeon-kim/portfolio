"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

export function DeliverStory({ features }: { features: Feature[] }) {
  const { active, items } = useActiveItem(features.length);
  // The hovered point belongs to one feature; a newly active feature starts at its first point.
  const [hovered, setHovered] = useState({ feature: 0, point: 0 });
  const point = hovered.feature === active ? hovered.point : 0;
  const setPoint = (p: number) => setHovered({ feature: active, point: p });
  const shot = (f: Feature, sizes: string) => <Image src={withBase(f.src)} alt={f.alt ?? ""} width={f.width ?? 1280} height={f.height ?? 800} sizes={sizes} />;

  return (
    <div className="dv-story dv-story-deliver">
      <div className="dv-story-stage">
        <div className="dv-story-screen" aria-hidden="true">
          {features.map((f, i) => (
            <div key={f.title} className="dv-story-shot" data-on={i === active || undefined}>
              {shot(f, "(max-width: 1023px) 100vw, 720px")}
              <Areas boxes={f.areas} current={point} onPick={setPoint} />
            </div>
          ))}
        </div>
        <Progress count={features.length} active={active} />
      </div>
      <ol className="dv-story-list">
        {features.map((f, i) => (
          <li key={f.title} ref={(el) => { items.current[i] = el; }} data-index={i} data-on={i === active || undefined} className="dv-story-item">
            <div className="dv-story-shot-inline">{shot(f, "100vw")}</div>
            <p className="dv-story-kicker">{f.kicker}</p>
            <h4 className="dv-story-name"><span>{pad(i + 1)}</span>{f.title}</h4>
            <div className="dv-story-detail">
              <p className="dv-story-body">{f.body}</p>
              <ol className="dv-story-points">
                {f.points.map((p, j) => (
                  <li key={p} data-on={i === active && j === point || undefined} onMouseEnter={() => setPoint(j)} onFocus={() => setPoint(j)} tabIndex={-1}>
                    <b>{j + 1}</b>{p}
                  </li>
                ))}
              </ol>
            </div>
          </li>
        ))}
      </ol>
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
              <p className="dv-story-before"><span className="sr-only">{labels.asIs}: </span>{c.before}</p>
              <p className="dv-story-after"><span aria-hidden="true">→ </span><span className="sr-only">{labels.toBe}: </span>{c.after}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
