"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { withBase } from "@/lib/site";

type Props = { visible: boolean };

type Slide = { key: string; label: string; src?: string; alt: string };

const INTERVAL = 4200;

// Scroll's middle step on the intro: the name and positioning move left and a
// card at the right cycles photos of Minyeon (placeholders until they exist). Each
// change slides the next image in from the right while the current one drifts
// left and blurs away.
export function IntroShowcase({ visible }: Props) {
  // TODO: real photos of Minyeon, e.g. /images/profile-1.webp (portrait, 1000x1050 WebP).
  const slides: Slide[] = [
    { key: "photo-1", label: "Photo 1", alt: "Minyeon Kim" },
    { key: "photo-2", label: "Photo 2", alt: "Minyeon Kim at work" },
    { key: "photo-3", label: "Photo 3", alt: "Minyeon Kim" },
  ];
  const [current, setCurrent] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Hover or keyboard focus holds the current slide.
  const playing = visible && !held && !reduce && slides.length > 1;
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

  function go(i: number) {
    if (i === current) return;
    setLast(current);
    setCurrent(i);
  }
  const position = (i: number) => (i === current ? "current" : i === last ? "previous" : "next");

  return (
    <div className="intro-showcase" aria-roledescription="carousel" aria-label="Photos of Minyeon Kim"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHeld(true); }}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false); }}>
      <div className="intro-showcase-card">
        {slides.map((s, i) => (
          <div key={s.key} className="intro-showcase-slide" data-position={position(i)} data-project={s.key}
            role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${s.label}`} aria-hidden={i !== current}>
            {s.src
              ? <Image src={withBase(s.src)} alt={s.alt} fill sizes="(min-width: 75rem) 500px, 440px" className="object-contain" />
              : <p className="intro-showcase-placeholder">Profile photo {i + 1}<span>Image to come</span></p>}
          </div>
        ))}
      </div>
      <div className="intro-showcase-dots">
        {slides.map((s, i) => (
          <button key={s.key} type="button" className="intro-showcase-dot" aria-label={`Show ${s.label}`} aria-current={i === current || undefined} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}
