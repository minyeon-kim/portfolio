"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { withBase } from "@/lib/site";

// One row of the "UI details" format (after superhuman.com's feature rows): a number,
// a title and a short text beside a soft case-colour card that holds the media. The
// media is a still cut-out, a looping prototype clip, two clips side by side (As-is /
// To-be) or a screenshot with numbered pins. Wide rows put the card under the text.

export type DetailClip = { src: string; poster?: string; rate?: number };
export type DetailMedia = {
  img?: { src: string; width: number; height: number; alt: string };
  clip?: DetailClip;
  alt?: string;
  pair?: { label: string; text?: string; clip: DetailClip; accent?: boolean }[];
  pins?: [number, number][];
};
export type DetailRow = {
  title: string;
  body?: ReactNode;
  lines?: [string, ReactNode, boolean?][];
  list?: { name: string; text: string }[];
  media: DetailMedia;
  wide?: boolean;
  id?: string;
};

// Plays while at least 40% of the clip is on screen; paused otherwise. With reduced
// motion it never autoplays and shows its controls instead.
function Clip({ clip, label }: { clip: DetailClip; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.playbackRate = clip.rate ?? 1;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.controls = true; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { v.playbackRate = clip.rate ?? 1; v.play().catch(() => { v.controls = true; }); }
      else v.pause();
    }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, [clip.rate]);
  return (
    <video ref={ref} src={withBase(clip.src)} poster={clip.poster ? withBase(clip.poster) : undefined}
      muted loop playsInline preload="metadata" aria-label={label} />
  );
}

function Media({ media, title }: { media: DetailMedia; title: string }) {
  if (media.pair) {
    return (
      <div className="dv-detail-pair">
        {media.pair.map((p) => (
          <figure key={p.label} data-accent={p.accent ? "" : undefined}>
            <figcaption><b>{p.label}</b>{p.text && <span>{p.text}</span>}</figcaption>
            <Clip clip={p.clip} label={`${title}: ${p.label}`} />
          </figure>
        ))}
      </div>
    );
  }
  if (media.clip) return <Clip clip={media.clip} label={media.alt ?? title} />;
  if (!media.img) return null;
  const img = <Image src={withBase(media.img.src)} alt={media.img.alt} width={media.img.width} height={media.img.height}
    sizes="(max-width: 1023px) 90vw, 1100px" style={{ "--dw": media.img.width * 0.75 } as CSSProperties} />;
  if (!media.pins) return img;
  return (
    <div className="dv-detail-pinned">
      {img}
      {media.pins.map(([x, y], i) => <span key={i} className="dv-detail-pin" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">{i + 1}</span>)}
    </div>
  );
}

export function DetailRows({ rows, className }: { rows: DetailRow[]; className?: string }) {
  return (
    <ol className={`dv-details-list${className ? ` ${className}` : ""}`}>
      {rows.map((d, i) => (
        <li key={d.title} id={d.id} className="dv-detail reveal" data-reveal-group="" data-wide={d.wide ? "" : undefined}>
          <div className="dv-detail-text">
            <div className="dv-detail-head">
              <span className="dv-detail-num">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="dv-detail-title">{d.title}</h4>
              {d.body && <p className="dv-detail-body">{d.body}</p>}
            </div>
            {(d.lines || d.list) && (
              <div className="dv-detail-side">
                {d.lines && d.lines.map(([label, text, strong]) => (
                  <p key={label} className="dv-detail-before" data-strong={strong ? "" : undefined}><span>{label}</span>{text}</p>
                ))}
                {d.list && (
                  <ol className="dv-detail-spec">
                    {d.list.map((l) => <li key={l.name}><b>{l.name}</b>{l.text}</li>)}
                  </ol>
                )}
              </div>
            )}
          </div>
          <div className="dv-detail-card"><Media media={d.media} title={d.title} /></div>
        </li>
      ))}
    </ol>
  );
}
