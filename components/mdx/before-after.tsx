"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Img = { src: string; alt: string };

type Props = {
  before: Img;
  after: Img;
  width: number;
  height: number;
  caption?: string;
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

// Drag (mouse, touch, pen) or use the arrow keys to compare two images.
// Vertical touch scrolling still works: only horizontal drags move the divider.
export function BeforeAfter({ before, after, width, height, caption }: Props) {
  const [pos, setPos] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect();
    if (box) setPos(clamp(((clientX - box.left) / box.width) * 100));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const stopDrag = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next: Record<string, number> = {
      ArrowLeft: pos - step,
      ArrowDown: pos - step,
      ArrowRight: pos + step,
      ArrowUp: pos + step,
      PageDown: pos - 10,
      PageUp: pos + 10,
      Home: 0,
      End: 100,
    };
    if (e.key in next) {
      e.preventDefault();
      setPos(clamp(next[e.key]));
    }
  };

  const label = "rounded-full bg-bg/70 px-1 font-mono text-xs text-ink backdrop-blur-md";

  return (
    <figure className="reveal my-4">
      <div
        ref={frame}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        className="relative cursor-ew-resize touch-pan-y overflow-hidden rounded-lg bg-fill select-none"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <Image
          src={after.src}
          alt={after.alt}
          width={width}
          height={height}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image
            src={before.src}
            alt={before.alt}
            width={width}
            height={height}
            loading="lazy"
            draggable={false}
            className="size-full object-cover"
          />
        </div>
        <span aria-hidden="true" className={`absolute top-1 left-1 ${label}`}>
          Before
        </span>
        <span aria-hidden="true" className={`absolute top-1 right-1 ${label}`}>
          After
        </span>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% before shown`}
          onKeyDown={onKeyDown}
          className="group absolute inset-y-0 flex w-4 -translate-x-1/2 justify-center outline-none"
          style={{ left: `${pos}%` }}
        >
          <span aria-hidden="true" className="h-full w-[2px] bg-accent" />
          <span
            aria-hidden="true"
            className="absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-bg transition-[scale] duration-150 ease-standard group-hover:scale-110 group-active:scale-95 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent group-focus-visible:outline-solid"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4 2 8l4 4M10 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      {caption && <figcaption className="mt-1 font-mono text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
