"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { setUi } from "@/lib/ui-store";
import { withBase } from "@/lib/site";

export type MoreWorkItem = { slug: string; name: string; description?: string; cover?: string; index?: number };

const MIN_CARDS = 3;
const MIN_ROTATING = 3;
const INTERVAL = 4200;

// End of a case: the other projects as a fanned deck. The next project is in
// front and opens with the shared page transition; the rest peek out behind it
// and fan out on hover, and a back card comes forward when clicked. Empty spots
// up to three are "In progress" cards (never links, no invented content). The
// deck turns on its own only once there are three or more real cases. On the
// home stage (items carry an index) a card selects that case; elsewhere it
// opens its page.
export function MoreWork({ items }: { items: MoreWorkItem[] }) {
  const router = useRouter();
  const [front, setFront] = useState(0);
  const [held, setHeld] = useState(false);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const rotating = items.length >= MIN_ROTATING && !held && !reduce;
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => setFront((f) => (f + 1) % items.length), INTERVAL);
    return () => clearTimeout(timer);
  }, [rotating, front, items.length]);

  const open = (item: MoreWorkItem) => {
    if (item.index !== undefined) {
      const index = item.index;
      revealNextProject(() => {
        setUi({ activeCase: index });
        window.scrollTo({ top: 0, behavior: "instant" });
      }, () => Boolean(document.querySelector(`main [data-stage-index="${index}"]`)));
      return;
    }
    const href = `/work/${item.slug}/`;
    revealNextProject(() => router.push(href, { scroll: false }), () => Boolean(document.querySelector(`[data-case-slug="${item.slug}"]`)));
  };
  if (!items.length) return null;
  const slots = Math.max(0, MIN_CARDS - items.length);
  const total = items.length + slots;
  // 0 front, 1 right, 2 left, further cards wait hidden behind the front one.
  const rank = (i: number) => (i - front + total) % total;
  const variant = (slug: string) => (slug === "workflow-app" ? "devsign" : slug === "gemini-privacy" ? "gemini" : undefined);
  const current = items[front];

  return (
    <nav aria-labelledby="more-work-label" className="more-work"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHeld(true); }}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false); }}>
      <h2 id="more-work-label" className="more-work-label">Next project</h2>
      <ul className="more-work-deck">
        {items.map((item, i) => {
          const r = rank(i);
          const media = (
            <span className="more-work-cover" data-project={item.slug}>
              {item.cover && <Image src={withBase(item.cover)} alt="" fill sizes="(min-width: 48rem) 400px, 70vw" className="object-contain" />}
            </span>
          );
          return (
            <li key={item.slug} className="more-work-card" data-rank={Math.min(r, 3)}>
              {r === 0 ? (
                <Link href={`/work/${item.slug}/`} className="more-work-hit" aria-label={`Open ${item.name}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                    event.preventDefault();
                    open(item);
                  }}>{media}</Link>
              ) : (
                <button type="button" className="more-work-hit" aria-label={`Bring ${item.name} forward`} tabIndex={r < 3 ? 0 : -1} onClick={() => setFront(i)}>{media}</button>
              )}
            </li>
          );
        })}
        {Array.from({ length: slots }, (_, k) => (
          <li key={`slot-${k}`} className="more-work-card more-work-slot" data-rank={Math.min(rank(items.length + k), 3)} aria-label="Case study in progress">
            <span className="more-work-cover"><span className="more-work-slot-label">In progress</span></span>
          </li>
        ))}
      </ul>
      <div className="more-work-caption" aria-live="polite">
        <Link key={current.slug} href={`/work/${current.slug}/`} className="more-work-title" tabIndex={-1}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            open(current);
          }}>
          <span className="more-work-name" data-variant={variant(current.slug)}>{current.name}</span>
          <svg className="more-work-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {current.description && <p className="more-work-description">{current.description}</p>}
      </div>
    </nav>
  );
}
