"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { withBase } from "@/lib/site";
import type { StageProject } from "./project-stage";

type Props = {
  projects: (StageProject & { index: number })[];
  visible: boolean;
  onOpen: (index: number) => void;
};

const INTERVAL = 4200;

// Scroll's middle step on the intro: the name and positioning move left and the
// featured projects cycle in a card at the right. Each change slides the next
// cover in from the right while the current one drifts left and blurs away.
export function IntroShowcase({ projects, visible, onOpen }: Props) {
  const slides = projects.filter((p) => p.cover);
  const [current, setCurrent] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const playing = visible && !paused && !hovered && !reduce && slides.length > 1;
  useEffect(() => {
    if (!playing || last !== null) return;
    const timer = setTimeout(() => go((current + 1) % slides.length), INTERVAL);
    return () => clearTimeout(timer);
  });
  // Once the outgoing slide has left, park it on the right again so it can enter
  // from there next time (with two slides it is also the next one).
  useEffect(() => {
    if (last === null) return;
    const timer = setTimeout(() => setLast(null), 950);
    return () => clearTimeout(timer);
  }, [last]);

  if (!slides.length) return null;
  function go(i: number) {
    if (i === current) return;
    setLast(current);
    setCurrent(i);
  }
  const position = (i: number) => (i === current ? "current" : i === last ? "previous" : "next");

  return (
    <div className="intro-showcase" aria-roledescription="carousel" aria-label="Selected work"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}>
      <div className="intro-showcase-card">
        {slides.map((p, i) => (
          <div key={p.slug} className="intro-showcase-slide" data-position={position(i)} data-project={p.slug}
            role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${p.name}`} aria-hidden={i !== current}>
            <Image src={withBase(p.cover!)} alt={`${p.name} project overview`} fill sizes="(min-width: 75rem) 480px, 0px" className="object-contain" />
          </div>
        ))}
      </div>
      <div className="intro-showcase-captions">
        {slides.map((p, i) => (
          <button key={p.slug} type="button" className="press intro-showcase-caption" data-position={position(i)}
            tabIndex={i === current ? 0 : -1} aria-hidden={i !== current} onClick={() => onOpen(p.index)}>
            <span className="intro-showcase-caption-label">{p.concept ? "Concept" : "Product"}{p.timeline && ` · ${p.timeline}`}</span>
            <span className="intro-showcase-caption-name">{p.name}</span>
            {p.role && <span className="intro-showcase-caption-role">{p.role}</span>}
            <span className="intro-showcase-caption-open" aria-hidden="true">Open case <span>→</span></span>
          </button>
        ))}
      </div>
      <div className="intro-showcase-controls">
        {slides.length > 1 && !reduce && (
          <button type="button" className="press intro-showcase-pause" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((p) => !p)}>
            <svg viewBox="0 0 16 16" aria-hidden="true" data-show={!paused || undefined}><rect x="4" y="3" width="2.5" height="10" rx="1" fill="currentColor" /><rect x="9.5" y="3" width="2.5" height="10" rx="1" fill="currentColor" /></svg>
            <svg viewBox="0 0 16 16" aria-hidden="true" data-show={paused || undefined}><path d="M5 3.5v9l7.5-4.5z" fill="currentColor" /></svg>
          </button>
        )}
        <div className="intro-showcase-dots">
          {slides.map((p, i) => (
            <button key={p.slug} type="button" className="intro-showcase-dot" aria-label={`Show ${p.name}`} aria-current={i === current || undefined} onClick={() => go(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}
