"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, SplitText);

// Letters and symbols a decoding glyph flickers through (Hangul for Hangul).
const LATIN = "abcdefghijklmnopqrstuvwxyz!@#$%^&*+-=_;:";
const HANGUL = "가나다라마바사아자차카타파하복잡제품처음끝디인합니";
const HANGUL_GLYPH = /\p{Script=Hangul}/u;
const TICK = 70; // ms between flickers
// The white curtain is still opening at first, so the settling starts once it's mostly open.
const LOAD_END = 1650; // ms, every glyph has settled
const TYPE_START = 700; // ms, the first glyphs settle
const TYPE_END = 1300; // ms, all but the emphasized word have settled
const EMPHASIS_START = 1400; // ms, the emphasized word starts settling
const RADIUS = 120; // px around the cursor that decodes again
const HOVER_MIN = 250; // ms a glyph at the rim stays scrambled
const HOVER_MAX = 700; // ms a glyph under the cursor can stay scrambled

type Props = { text: string; className?: string; emphasis?: string };
type Glyph = { start: number; until: number };

// "Decrypted" hero headline, after sui.io: the whole line decodes at once. Each glyph
// flickers through blanks and random characters, in the headline's own colour at varying
// strength, and settles on its own at a random moment. After load, glyphs near the mouse do the
// same. With reduced motion, or on phones, the server-rendered text is shown as is.
export function ScrambleHeadline({ text, className, emphasis }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 48rem)", () => {
        let chars: HTMLElement[] = [];
        const active = new Map<HTMLElement, Glyph>();
        let timer = 0;
        let frame = 0;
        let pointer = { x: 0, y: 0 };
        const loadStart = performance.now();

        const settle = (char: HTMLElement) => {
          char.textContent = char.dataset.char ?? "";
          delete char.dataset.g;
          active.delete(char);
        };
        const flicker = (char: HTMLElement, progress: number) => {
          const original = char.dataset.char ?? "";
          const roll = Math.random();
          // Mostly noise at first, mostly the real letter near the end.
          if (roll < progress * 0.65) char.textContent = original;
          else if (roll < progress * 0.65 + (1 - progress) * 0.35) char.textContent = "\u00a0";
          else {
            const pool = HANGUL_GLYPH.test(original) ? HANGUL : LATIN;
            char.textContent = pool[Math.floor(Math.random() * pool.length)];
          }
          const tone = Math.random();
          if (tone < 0.25) char.dataset.g = "dim";
          else if (tone < 0.55) char.dataset.g = "mid";
          else delete char.dataset.g;
        };
        const tick = () => {
          const now = performance.now();
          for (const [char, glyph] of active) {
            if (now >= glyph.until) settle(char);
            else if (now >= glyph.start) flicker(char, (now - glyph.start) / (glyph.until - glyph.start));
          }
          timer = active.size ? window.setTimeout(tick, TICK) : 0;
        };
        const run = () => {
          if (!timer) timer = window.setTimeout(tick, TICK);
        };

        const decodeNearCursor = () => {
          frame = 0;
          const box = el.getBoundingClientRect();
          if (pointer.x < box.left - RADIUS || pointer.x > box.right + RADIUS || pointer.y < box.top - RADIUS || pointer.y > box.bottom + RADIUS) return;
          const now = performance.now();
          for (const char of chars) {
            const r = char.getBoundingClientRect();
            const dist = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
            if (dist >= RADIUS || !(char.dataset.char ?? "").trim()) continue;
            const reach = HOVER_MIN + (HOVER_MAX - HOVER_MIN) * (1 - dist / RADIUS) * (0.5 + Math.random() * 0.5);
            const glyph = active.get(char);
            if (glyph) glyph.until = Math.max(glyph.until, now + reach);
            else active.set(char, { start: now, until: now + reach });
          }
          run();
        };
        const onPointerMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          pointer = { x: e.clientX, y: e.clientY };
          if (!frame) frame = requestAnimationFrame(decodeNearCursor);
        };

        const split = SplitText.create(el, {
          type: "words,chars",
          aria: "none", // the heading keeps its own aria-label
          autoSplit: true, // re-split when fonts load or the line wraps change
          onSplit(self) {
            chars = self.chars as HTMLElement[];
            active.clear();
            // Letters of any script, so a Korean word matches too.
            const find = (word?: string) => word
              ? (self.words as HTMLElement[]).find((w) => (w.textContent ?? "").toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "") === word.toLowerCase())
              : undefined;
            const target = find(emphasis);
            const now = performance.now();
            for (const char of chars) {
              char.dataset.char = char.textContent ?? "";
              // Lock each glyph's width so a scrambled glyph never reflows the line.
              // In em, because the headline's size follows the window.
              char.style.width = `${char.getBoundingClientRect().width / parseFloat(getComputedStyle(char).fontSize)}em`;
              char.style.textAlign = "center";
              // The emphasized word settles last; the rest at random moments.
              const held = target?.contains(char);
              const at = held ? EMPHASIS_START + Math.random() * (LOAD_END - EMPHASIS_START) : TYPE_START + Math.random() * (TYPE_END - TYPE_START);
              const until = loadStart + at;
              if (until > now) active.set(char, { start: now, until });
            }
            for (const char of active.keys()) flicker(char, 0);
            gsap.set(el, { visibility: "visible" });
            run();
          },
        });
        const armed = window.setTimeout(() => window.addEventListener("pointermove", onPointerMove), LOAD_END);

        return () => {
          window.clearTimeout(armed);
          window.clearTimeout(timer);
          window.removeEventListener("pointermove", onPointerMove);
          cancelAnimationFrame(frame);
          active.clear();
          split.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [text, emphasis] },
  );

  return (
    <h1 ref={ref} aria-label={text.replace(/\n/g, " ")} data-scramble className={className}>
      {/* A "\n" in the text sets its own line, so the breaks don't depend on the face or width. */}
      {text.includes("\n")
        ? text.split("\n").map((line, i) => <span key={i} className="scramble-line">{line}</span>)
        : text}
    </h1>
  );
}
