"use client";

import Link from "next/link";
import { useRef, type ComponentProps } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin);

const CHARS = "01#$%&";

// Nav link with the "Decrypted" motif: on hover or keyboard focus the label
// scrambles and resolves left to right. Set in Geist Mono, so every glyph is
// the same width and nothing shifts. Screen readers get the plain label.
export function ScrambleLink({
  label,
  className = "",
  ...props
}: { label: string } & Omit<ComponentProps<typeof Link>, "children">) {
  const text = useRef<HTMLSpanElement>(null);

  const play = () => {
    if (!text.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(text.current, {
      duration: 0.4,
      ease: "none",
      overwrite: true,
      scrambleText: { text: label, chars: CHARS, speed: 0.6 },
    });
  };

  return (
    <Link {...props} aria-label={label} onMouseEnter={play} onFocus={play} className={`font-mono ${className}`}>
      <span ref={text} aria-hidden="true">
        {label}
      </span>
    </Link>
  );
}
