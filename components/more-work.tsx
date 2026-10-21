"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { setUi } from "@/lib/ui-store";

export type MoreWorkItem = { slug: string; name: string; description?: string; index?: number };

const MIN_SLOTS = 3;

// End of a case: the other projects as equal cards to choose from. Real cases
// come first in display order; empty slots up to three are marked "In progress"
// (not links, no invented content) and fill themselves as cases are added.
// Cards use the shared page transition. On the home stage (items carry an
// index) a card selects that case; elsewhere it opens its page.
export function MoreWork({ items }: { items: MoreWorkItem[] }) {
  const router = useRouter();
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
  const empty = Math.max(0, MIN_SLOTS - items.length);
  const variant = (slug: string) => (slug === "workflow-app" ? "devsign" : slug === "gemini-privacy" ? "gemini" : undefined);

  return (
    <nav aria-labelledby="more-work-label" className="more-work">
      <h2 id="more-work-label" className="more-work-label">More work</h2>
      <ul className="more-work-grid">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/work/${item.slug}/`}
              className="more-work-card lift press"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                open(item);
              }}
            >
              <span className="more-work-name" data-variant={variant(item.slug)}>{item.name}</span>
              {item.description && <span className="more-work-description">{item.description}</span>}
              <svg className="more-work-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
        {Array.from({ length: empty }, (_, k) => (
          <li key={`slot-${k}`}>
            <div className="more-work-card more-work-slot" aria-label="Case study in progress">
              <span className="more-work-slot-label">In progress</span>
              <span className="more-work-description">A new case study is being written.</span>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
