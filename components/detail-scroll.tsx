"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { withBase } from "@/lib/site";

type Item = { title: string; body: string; src: string; width: number; height: number; alt: string; before?: string };

// UI details that change with the scroll (owner): on desktop the card holds at the right while
// the texts scroll past at the left; the text nearest the middle of the screen is current and
// its card crossfades in. Native scroll only. Phones and reduced motion keep one card under
// each text.
export function DetailScroll({ items, asIs }: { items: Item[]; asIs: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    // The text whose box holds the middle of the screen is current (plain scroll listener, so it
    // also works where observers are throttled).
    const read = () => {
      const mid = window.innerHeight / 2;
      let best = 0, dist = Infinity;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < dist) { dist = d; best = i; }
      });
      setActive(best);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => { window.removeEventListener("scroll", read); window.removeEventListener("resize", read); };
  }, []);
  const card = (d: Item, i: number) => (
    <Image src={withBase(d.src)} alt={d.alt} width={d.width} height={d.height} sizes="(max-width: 1023px) 90vw, 640px" style={{ "--dw": d.width * 0.75 } as CSSProperties} />
  );
  return (
    <div className="dv-dscroll">
      <ol className="dv-dscroll-text">
        {items.map((d, i) => (
          <li key={d.title} ref={(el) => { refs.current[i] = el; }} data-i={i} data-t={i % 4} data-on={i === active || undefined}>
            <span className="dv-detail-num">{String(i + 1).padStart(2, "0")}</span>
            <h4 className="dv-detail-title">{d.title}</h4>
            <p className="dv-detail-body">{d.body}</p>
            {d.before && <p className="dv-detail-before"><span>{asIs}</span>{d.before}</p>}
            <div className="dv-dscroll-inline dv-detail-card" data-t={i % 4}>{card(d, i)}</div>
          </li>
        ))}
      </ol>
      <div className="dv-dscroll-stage" aria-hidden="true">
        {items.map((d, i) => (
          <div key={d.title} className="dv-detail-card" data-t={i % 4} data-on={i === active || undefined}>{card(d, i)}</div>
        ))}
      </div>
    </div>
  );
}
