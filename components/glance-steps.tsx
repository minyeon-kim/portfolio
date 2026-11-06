"use client";

import type { CSSProperties } from "react";
import { useHeldSteps } from "./devsign-story";

type Item = { tone: string; label: string; title: string; text: string };

// The Overview summary as three steps read down, not three columns read across (owner).
// On desktop the stage holds centred while native scroll moves Problem → Solution → Impact;
// elsewhere, and with reduced motion, the three stack as rows.
export function GlanceSteps({ items, label }: { items: Item[]; label: string }) {
  const { root, active, pinned, go } = useHeldSteps(items.length);
  return (
    <div ref={root} className="dv-gs" data-pinned={pinned || undefined} style={{ "--n": items.length } as CSSProperties}>
      <div className="dv-gs-stage">
        <ol className="dv-gs-list" aria-label={label}>
          {items.map((item, i) => (
            <li key={item.label} data-tone={item.tone} data-on={!pinned || i === active || undefined}>
              <button type="button" className="dv-gs-name" onClick={() => go(i)} tabIndex={pinned ? 0 : -1} aria-current={pinned && i === active ? "step" : undefined}>
                <b>{String(i + 1).padStart(2, "0")}</b>{item.label}
              </button>
              <div className="dv-gs-body">
                <p className="dv-gs-title">{item.title}</p>
                <p className="dv-gs-text">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
