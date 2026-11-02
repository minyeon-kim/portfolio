"use client";

import { useEffect, useRef } from "react";

const PITCH = 24; // the dot grid in CSS (.devsign-hero-panel); dots sit at the middle of each cell
const REACH = 150;
const FALLOFF = (REACH * REACH) / 4;
const ACTIVE = "(min-width: 64rem) and (hover: hover)";

// Slow paths in the panel's side margins, clear of the centered title.
const paths = [
  (t: number, w: number) => [w * (0.13 + 0.05 * Math.sin(t * 0.37)), 135 + 35 * Math.sin(t * 0.53 + 1)],
  (t: number, w: number) => [w * (0.84 + 0.05 * Math.sin(t * 0.31 + 2)), 310 + 30 * Math.cos(t * 0.43)],
];
const CURSOR_COLORS = ["#7c5cff", "#0b7f56"];

// The opener's backdrop: the product's canvas. The dots themselves are a CSS
// background; this draws only the ones waking up around the live cursors and
// the visitor's mouse. Desktop with a mouse only; with reduced motion the
// cursors stay put and the dots around them stay lit. Decorative.
export function HeroCanvas({ cursors = [] }: { cursors?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = canvas?.closest<HTMLElement>(".devsign-hero-panel");
    const context = canvas?.getContext("2d");
    if (!canvas || !panel || !context || !window.matchMedia(ACTIVE).matches) return;

    let width = 0, height = 0, ratio = 1;
    let mouse: [number, number] | null = null;
    let inView = true, frame = 0, last = 0;

    const draw = (t: number) => {
      const lights = paths.slice(0, cursors.length).map((path) => path(t, width));
      lights.forEach(([x, y], i) => { const el = cursorRefs.current[i]; if (el) el.style.transform = `translate(${x}px, ${y}px)`; });
      if (mouse) lights.push(mouse);
      context.clearRect(0, 0, width, height);
      context.fillStyle = getComputedStyle(canvas).color;
      lights.forEach(([lx, ly], index) => {
        const firstCol = Math.max(0, Math.floor((lx - REACH) / PITCH)), lastCol = Math.ceil((lx + REACH) / PITCH);
        const firstRow = Math.max(0, Math.floor((ly - REACH) / PITCH)), lastRow = Math.ceil((ly + REACH) / PITCH);
        for (let row = firstRow; row <= lastRow; row++) for (let col = firstCol; col <= lastCol; col++) {
          const x = col * PITCH + PITCH / 2, y = row * PITCH + PITCH / 2;
          const near = lights.map(([ax, ay]) => Math.exp(-((x - ax) ** 2 + (y - ay) ** 2) / FALLOFF));
          const strongest = Math.max(...near);
          if (near[index] < strongest || strongest < 0.03) continue; // each dot is drawn once, by its nearest light
          context.globalAlpha = 0.9 * strongest;
          context.beginPath();
          context.arc(x, y, 1 + 1.1 * strongest, 0, Math.PI * 2);
          context.fill();
        }
      });
      context.globalAlpha = 1;
    };

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = panel.clientWidth;
      height = panel.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const sizes = new ResizeObserver(() => { resize(); draw(last / 1000); });
    sizes.observe(panel);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
      return () => sizes.disconnect();
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = panel.getBoundingClientRect();
      mouse = [event.clientX - box.left, event.clientY - box.top];
    };
    const onLeave = () => { mouse = null; };
    panel.addEventListener("pointermove", onMove, { passive: true });
    panel.addEventListener("pointerleave", onLeave);
    const sight = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    sight.observe(panel);

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < 33 || !inView || document.hidden || document.documentElement.hasAttribute("data-project-navigation")) return;
      last = now;
      draw(now / 1000);
    };
    draw(0);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      sight.disconnect();
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
    };
  }, [cursors.length]);

  return (
    <div className="hero-canvas" aria-hidden="true">
      <canvas ref={canvasRef} />
      {cursors.map((name, i) => (
        <span key={name} ref={(el) => { cursorRefs.current[i] = el; }} className="hero-cursor" style={{ color: CURSOR_COLORS[i] }}>
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 1l11 6-5 1.5L6 14z" /></svg>
          <b>{name}</b>
        </span>
      ))}
    </div>
  );
}
