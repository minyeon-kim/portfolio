"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";

// Same rule as the case pages' held cards: pinned only where there is room and motion is allowed.
const PIN = "(min-width: 64rem) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

type Row = { then: string; note?: string; title: string; body: string };

// Security consulting turning into product design, one pair at a time. On wide screens the
// pair holds on screen while native scroll moves through the three (70svh each); the left
// sentence settles first and the right one follows, so each reads as "this became that".
// Elsewhere it is the plain list of pairs.
export function AboutBridge({ rows, then, now, label }: { rows: Row[]; then: string; now: string; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const query = window.matchMedia(PIN);
    let frame = 0;
    const read = () => {
      frame = 0;
      const stage = (el.firstElementChild as HTMLElement).offsetHeight;
      const top = Math.max(96, Math.round((window.innerHeight - stage) / 2));
      el.style.setProperty("--stage-top", `${top}px`);
      const travel = el.offsetHeight - stage;
      const progress = travel > 0 ? Math.min(1, Math.max(0, (top - el.getBoundingClientRect().top) / travel)) : 0;
      setActive(Math.min(rows.length - 1, Math.floor(progress * rows.length)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    const sync = () => { setPinned(query.matches); onScroll(); };
    sync();
    query.addEventListener("change", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rows.length]);
  const go = (i: number) => {
    const el = root.current;
    if (!el) return;
    const stage = (el.firstElementChild as HTMLElement).offsetHeight;
    const top = Math.max(96, Math.round((window.innerHeight - stage) / 2));
    const travel = el.offsetHeight - stage;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - top + ((i + 0.5) / rows.length) * travel, behavior: "smooth" });
  };

  if (!pinned) {
    return (
      <div ref={root}>
        <ol className="about-bridge-rows">
          {rows.map((row) => (
            <li key={row.title} className="reveal">
              <div>
                <p className="about-bridge-tag">{then}</p>
                <p className="about-bridge-then">{row.then}</p>
                {row.note && <p className="about-bridge-text">{row.note}</p>}
              </div>
              <ArrowIcon />
              <div>
                <p className="about-bridge-tag" data-now="">{now}</p>
                <h3>{row.title}</h3>
                <p className="about-bridge-text">{row.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div ref={root} className="about-turn" style={{ "--n": rows.length } as React.CSSProperties}>
      <div className="about-turn-stage">
        <div className="about-turn-head" aria-hidden="true">
          <span>{then}</span>
          <span>{now}</span>
        </div>
        <ol className="about-turn-rows">
          {rows.map((row, i) => (
            <li key={row.title} data-on={i === active || undefined} aria-hidden={i !== active || undefined}>
              <div className="about-turn-then">
                <p>{row.then}</p>
                {row.note && <p className="about-bridge-text">{row.note}</p>}
              </div>
              <span className="about-turn-arrow"><ArrowIcon size={28} /></span>
              <div className="about-turn-now">
                <h3>{row.title}</h3>
                <p className="about-bridge-text">{row.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="about-turn-foot">
          <span className="about-turn-count">{active + 1} / {rows.length}</span>
          <div role="group" aria-label={label} className="about-turn-steps">
            {rows.map((row, i) => (
              <button key={row.title} type="button" aria-label={row.title} aria-pressed={i === active} onClick={() => go(i)}><i /></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// The email itself, large, as the last thing on the page: pressing it copies the address
// and says so in place; the mail link sits next to it.
export function AboutEmail({ email, copied, hint }: { email: string; copied: string; hint: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setDone(true); } catch { setDone(false); }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" className="about-email" data-done={done || undefined} onClick={copy}>
      <span className="about-email-address">{email}</span>
      <span className="about-email-hint" aria-hidden="true">
        <span>{hint}</span>
        <span>{copied}</span>
      </span>
      <span role="status" className="sr-only">{done ? copied : ""}</span>
    </button>
  );
}
