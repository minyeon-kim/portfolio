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
const HOVER_DURATION = 0.35; // seconds, cursor re-scramble at the cursor's center
// Kept light: only a short run of glyphs is ever scrambled at once.
const GLYPH_SCRAMBLE = 0.1; // seconds each glyph spends scrambled on load (~9-glyph front)
const SPEED = 0.25; // how often a scrambled glyph changes (lower = calmer)

type Props = { text: string; className?: string };

// "Decrypted" hero headline: scrambles in left to right on load, then
// characters near the mouse cursor briefly re-scramble. With reduced motion
// none of this runs and the server-rendered text is shown as is.
export function ScrambleHeadline({ text, className }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let chars: HTMLElement[] = [];
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
            if (dist >= RADIUS) continue;
            gsap.to(char, {
              duration: HOVER_DURATION * (1 - dist / RADIUS),
              ease: "none",
              overwrite: true,
              scrambleText: { text: char.dataset.char ?? "", chars: CHARS, speed: SPEED },
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
        const span = LOAD_DURATION - GLYPH_SCRAMBLE;
        chars.forEach((char, i) => {
          const at = chars.length > 1 ? (i / (chars.length - 1)) * span : 0;
          load.set(char, { autoAlpha: 1 }, at);
          load.to(
            char,
            {
              duration: GLYPH_SCRAMBLE,
              ease: "none",
              scrambleText: {
                text: char.dataset.char ?? "",
                chars: CHARS,
                speed: SPEED,
                // A one-glyph scramble otherwise resolves halfway through the tween.
                revealDelay: GLYPH_SCRAMBLE - 0.05,
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
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <h1 ref={ref} aria-label={text} data-scramble className={className}>
      {text}
    </h1>
  );
}
