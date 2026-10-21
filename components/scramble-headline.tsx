"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin, SplitText);

const CHARS = "01#$%&";
const LOAD_DURATION = 1.2; // seconds, the hard cap for the load reveal
const RADIUS = 56; // px around the cursor that re-scrambles after load (2-3 glyphs)
const HOVER_DURATION = 0.85; // seconds, cursor re-scramble at the cursor's center
const HOVER_MIN_DURATION = 0.4; // edge glyphs still get a readable decrypt beat
// Kept light: only a short run of glyphs is ever scrambled at once.
const GLYPH_SCRAMBLE = 0.1; // seconds each glyph spends scrambled on load (~9-glyph front)
const SPEED = 0.25; // how often a scrambled glyph changes (lower = calmer)

// The emphasized word stays encrypted after it appears and resolves last,
// still inside LOAD_DURATION.
const TYPE_END = 0.85; // seconds, the rest of the line has typed out
const EMPHASIS_START = 0.95; // seconds, the emphasized word starts resolving

type Props = { text: string; className?: string; emphasis?: string };

// "Decrypted" hero headline: scrambles in left to right on load, then
// characters near the mouse cursor briefly re-scramble. With reduced motion
// none of this runs and the server-rendered text is shown as is.
export function ScrambleHeadline({ text, className, emphasis }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let chars: HTMLElement[] = [];
        let held = new Set<HTMLElement>();
        let frame = 0;
        let pointer = { x: 0, y: 0 };

        const scrambleNearCursor = () => {
          frame = 0;
          const box = el.getBoundingClientRect();
          if (
            pointer.x < box.left - RADIUS ||
            pointer.x > box.right + RADIUS ||
            pointer.y < box.top - RADIUS ||
            pointer.y > box.bottom + RADIUS
          ) {
            return;
          }
          for (const char of chars) {
            const r = char.getBoundingClientRect();
            const dist = Math.hypot(
              pointer.x - (r.left + r.width / 2),
              pointer.y - (r.top + r.height / 2),
            );
            if (dist >= RADIUS || gsap.isTweening(char)) continue;
            // Let each glyph finish instead of restarting it on every mouse move.
            const duration = HOVER_MIN_DURATION + (HOVER_DURATION - HOVER_MIN_DURATION) * (1 - dist / RADIUS);
            gsap.to(char, {
              duration,
              ease: "none",
              overwrite: true,
              scrambleText: { text: char.dataset.char ?? "", chars: CHARS, speed: 0.18, revealDelay: duration * 0.65 },
            });
          }
        };

        const onPointerMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          pointer = { x: e.clientX, y: e.clientY };
          if (!frame) frame = requestAnimationFrame(scrambleNearCursor);
        };

        const split = SplitText.create(el, {
          type: "words,chars",
          aria: "none", // the heading keeps its own aria-label
          autoSplit: true, // re-split when fonts load or the line wraps change
          onSplit(self) {
            chars = self.chars as HTMLElement[];
            const word = emphasis?.toLowerCase();
            const target = word
              ? (self.words as HTMLElement[]).find((w) => (w.textContent ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "") === word)
              : undefined;
            held = new Set(target ? chars.filter((char) => target.contains(char)) : []);
            for (const char of chars) {
              char.dataset.char = char.textContent ?? "";
              // Lock each glyph's width so a scrambled glyph never reflows the line.
              char.style.width = `${char.getBoundingClientRect().width}px`;
              char.style.textAlign = "center";
            }
          },
        });

        // The line types out left to right; only the few glyphs at the front
        // are scrambled at any moment, each for GLYPH_SCRAMBLE, so the rest is
        // either already readable or not shown yet. Done by LOAD_DURATION.
        gsap.set(chars, { autoAlpha: 0 });
        const load = gsap.timeline({
          onStart: () => gsap.set(el, { visibility: "visible" }),
          onComplete: () => window.addEventListener("pointermove", onPointerMove),
        });
        const span = (held.size ? TYPE_END : LOAD_DURATION) - GLYPH_SCRAMBLE;
        const heldChars = chars.filter((char) => held.has(char));
        // Typing is compressed when a word is held, so each glyph scrambles for
        // proportionally less time and the scrambled front stays as short.
        const glyph = GLYPH_SCRAMBLE * (span / (LOAD_DURATION - GLYPH_SCRAMBLE));
        chars.forEach((char, i) => {
          const at = chars.length > 1 ? (i / (chars.length - 1)) * span : 0;
          load.set(char, { autoAlpha: 1 }, at);
          const order = heldChars.indexOf(char);
          if (order >= 0) {
            // Encrypted from the moment it appears; resolves left to right at the end.
            const resolveAt = EMPHASIS_START + (heldChars.length > 1 ? (order / (heldChars.length - 1)) * (LOAD_DURATION - EMPHASIS_START - 0.05) : 0);
            const duration = resolveAt - at + 0.05;
            load.to(
              char,
              {
                duration,
                ease: "none",
                scrambleText: { text: char.dataset.char ?? "", chars: CHARS, speed: SPEED, revealDelay: duration - 0.05 },
              },
              at,
            );
            return;
          }
          load.to(
            char,
            {
              duration: glyph,
              ease: "none",
              scrambleText: {
                text: char.dataset.char ?? "",
                chars: CHARS,
                speed: SPEED,
                // A one-glyph scramble otherwise resolves halfway through the tween.
                revealDelay: Math.max(0, glyph - 0.05),
              },
            },
            at,
          );
        });

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          cancelAnimationFrame(frame);
          split.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [text, emphasis] },
  );

  return (
    <h1 ref={ref} aria-label={text} data-scramble className={className}>
      {text}
    </h1>
  );
}
