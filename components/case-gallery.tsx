"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { withBase } from "@/lib/site";

type GalleryItem = { label: string; caption?: string; src?: string; alt?: string };

export function CaseGallery({ title, items }: { title: string; items: GalleryItem[] }) {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = section.current;
    const frame = viewport.current;
    const strip = track.current;
    if (!root || !frame || !strip) return;
    const media = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!media.matches || items.length < 2) {
        root.removeAttribute("data-pinned");
        strip.style.removeProperty("transform");
        return;
      }
      root.dataset.pinned = "true";
      const bounds = root.getBoundingClientRect();
      const distance = Math.max(1, root.offsetHeight - frame.offsetHeight);
      const progress = Math.max(0, Math.min(1, (72 - bounds.top) / distance));
      const travel = Math.max(0, strip.scrollWidth - frame.clientWidth);
      strip.style.transform = `translate3d(${-travel * progress}px, 0, 0)`;
      root.style.setProperty("--gallery-progress", String(progress));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(frame);
    update();
    media.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      media.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.removeAttribute("data-pinned");
      strip.style.removeProperty("transform");
    };
  }, [items.length]);

  if (!items.length) return null;
  return (
    <>
      <section ref={section} className="case-gallery" style={{ "--gallery-count": items.length } as React.CSSProperties} aria-label={title}>
        <div ref={viewport} className="case-gallery-viewport">
          <div className="case-gallery-heading"><span>{title}</span><a href={`#${id}-end`}>Continue reading ↓</a></div>
          <div ref={track} className="case-gallery-track">
            {items.map((item, index) => (
              <figure className="case-gallery-slide" key={`${item.label}-${index}`}>
                <div className="case-gallery-image">
                  {item.src ? <Image src={withBase(item.src)} alt={item.alt ?? item.label} width={1600} height={1000} sizes="(max-width: 767px) 100vw, 80vw" /> : <div className="case-gallery-placeholder" role="img" aria-label={`Image placeholder: ${item.label}`}><span className="case-gallery-number">{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span><small>Image to come</small><i aria-hidden="true" /></div>}
                </div>
                <figcaption><span>{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span><span>{item.caption ?? item.label}</span></figcaption>
              </figure>
            ))}
          </div>
          <div className="case-gallery-progress" aria-hidden="true"><span /></div>
        </div>
      </section>
      <div id={`${id}-end`} className="case-gallery-end" />
    </>
  );
}
