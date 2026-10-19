"use client";

import { useId, useRef, useState, type CSSProperties } from "react";

// One set of token values drives the preview and both code snippets, so the
// three can never disagree. Changed code lines flash briefly.

type Tokens = { hue: number; radius: number; space: number };

const DEFAULTS: Tokens = { hue: 231, radius: 6, space: 8 };

function hslToHex(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function resolve({ hue, radius, space }: Tokens) {
  const primary = hslToHex(hue, 87, 54);
  // Pick whichever text color passes contrast better on the chosen fill.
  const onPrimary =
    contrast(primary, "#FFFFFF") >= contrast(primary, "#0E1111") ? "#FFFFFF" : "#0E1111";
  return {
    primary,
    onPrimary,
    ratio: contrast(primary, onPrimary),
    radius: `${radius}px`,
    space1: `${space}px`,
    space2: `${space * 2}px`,
  };
}

type Resolved = ReturnType<typeof resolve>;
type Line = { text: string; key?: keyof Resolved };

function cssLines(t: Resolved): Line[] {
  return [
    { text: ":root {" },
    { text: `  --color-primary: ${t.primary};`, key: "primary" },
    { text: `  --color-on-primary: ${t.onPrimary};`, key: "onPrimary" },
    { text: `  --radius-control: ${t.radius};`, key: "radius" },
    { text: `  --space-1: ${t.space1};`, key: "space1" },
    { text: `  --space-2: ${t.space2};`, key: "space2" },
    { text: "}" },
  ];
}

function jsonLines(t: Resolved): Line[] {
  return [
    { text: "{" },
    { text: '  "color": {' },
    { text: `    "primary": "${t.primary}",`, key: "primary" },
    { text: `    "on-primary": "${t.onPrimary}"`, key: "onPrimary" },
    { text: "  }," },
    { text: `  "radius": { "control": "${t.radius}" },`, key: "radius" },
    { text: '  "space": {' },
    { text: `    "1": "${t.space1}",`, key: "space1" },
    { text: `    "2": "${t.space2}"`, key: "space2" },
    { text: "  }" },
    { text: "}" },
  ];
}

export function TokenPlayground({ wide = true }: { wide?: boolean }) {
  const [tokens, setTokens] = useState(DEFAULTS);
  const resolved = resolve(tokens);

  // Count changes per resolved key; a new count remounts that line and
  // restarts its highlight animation.
  const [versions, setVersions] = useState<Partial<Record<keyof Resolved, number>>>({});
  const previous = useRef(resolved);

  const update = (patch: Partial<Tokens>) => {
    const next = { ...tokens, ...patch };
    const nextResolved = resolve(next);
    const bumped = { ...versions };
    for (const key of Object.keys(nextResolved) as (keyof Resolved)[]) {
      if (key !== "ratio" && nextResolved[key] !== previous.current[key]) {
        bumped[key] = (bumped[key] ?? 0) + 1;
      }
    }
    previous.current = nextResolved;
    setVersions(bumped);
    setTokens(next);
  };

  const id = useId();
  const previewVars = {
    "--pg-primary": resolved.primary,
    "--pg-on-primary": resolved.onPrimary,
    "--pg-radius": resolved.radius,
    "--pg-space-1": resolved.space1,
    "--pg-space-2": resolved.space2,
  } as CSSProperties;

  const panel = "rounded-md bg-fill";
  const heading = "mb-2 font-mono text-xs text-muted";

  return (
    <figure
      // `wide` lets it spill into the empty right margin beside a 680px case column.
      className={`reveal my-6 ${wide ? "lg:w-[calc(min(100vw,1200px)/2+300px)] lg:max-w-none" : ""}`}
    >
      <div className="grid gap-2 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Controls */}
        <fieldset className={`${panel} min-w-0 p-2`}>
          <legend className="sr-only">Design tokens</legend>
          <p aria-hidden="true" className={heading}>
            Tokens
          </p>
          <Slider
            id={`${id}-hue`}
            label="Primary color"
            value={tokens.hue}
            min={0}
            max={359}
            step={1}
            display={resolved.primary}
            valueText={`${resolved.primary}, hue ${tokens.hue}`}
            onChange={(hue) => update({ hue })}
            trackStyle={{
              backgroundImage:
                "linear-gradient(to right, hsl(0 87% 54%), hsl(60 87% 54%), hsl(120 87% 54%), hsl(180 87% 54%), hsl(240 87% 54%), hsl(300 87% 54%), hsl(359 87% 54%))",
            }}
          />
          <Slider
            id={`${id}-radius`}
            label="Radius"
            value={tokens.radius}
            min={0}
            max={16}
            step={1}
            display={resolved.radius}
            onChange={(radius) => update({ radius })}
          />
          <Slider
            id={`${id}-space`}
            label="Spacing"
            value={tokens.space}
            min={4}
            max={16}
            step={4}
            display={resolved.space1}
            onChange={(space) => update({ space })}
          />
          <button
            type="button"
            onClick={() => update(DEFAULTS)}
            className="mt-1 press link font-mono text-xs text-muted transition-colors duration-150 ease-standard hover:text-ink"
          >
            Reset
          </button>
        </fieldset>

        {/* Live preview. Inert: it shows components, it isn't a form. */}
        <div className={`${panel} min-w-0 p-2`}>
          <p className={heading}>Preview</p>
          <div
            inert
            aria-label="Preview of a button, an input and a card using these tokens"
            role="img"
            style={previewVars}
            className="flex flex-col gap-[var(--pg-space-2)] rounded-md bg-bg p-2"
          >
            <div className="flex flex-wrap items-center gap-[var(--pg-space-1)]">
              <span
                className="inline-flex items-center rounded-[var(--pg-radius)] bg-[var(--pg-primary)] px-[var(--pg-space-2)] py-[var(--pg-space-1)] text-sm font-medium text-[var(--pg-on-primary)]"
              >
                Request review
              </span>
              <span className="inline-flex items-center rounded-[var(--pg-radius)] border border-line px-[var(--pg-space-2)] py-[var(--pg-space-1)] text-sm">
                Cancel
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-muted">Reviewer</span>
              <span className="rounded-[var(--pg-radius)] border border-[var(--pg-primary)] bg-surface px-[var(--pg-space-1)] py-[var(--pg-space-1)] text-sm text-muted outline-2 outline-offset-0 outline-[color-mix(in_srgb,var(--pg-primary)_25%,transparent)] outline-solid">
                alex@team.dev
              </span>
            </div>
            <div className="rounded-[var(--pg-radius)] border border-line bg-surface p-[var(--pg-space-2)]">
              <div className="mb-[var(--pg-space-1)] flex items-center justify-between gap-1">
                <span className="text-sm font-medium">Place order button</span>
                <span className="rounded-[var(--pg-radius)] bg-[color-mix(in_srgb,var(--pg-primary)_15%,transparent)] px-0.5 font-mono text-xs text-ink">
                  2 changes
                </span>
              </div>
              <p className="text-xs text-muted">Height 44px · primary color token</p>
            </div>
          </div>
          <p className="mt-1 font-mono text-xs text-muted">
            Text contrast {resolved.ratio.toFixed(1)}:1 {resolved.ratio >= 4.5 ? "· AA" : "· below AA"}
          </p>
        </div>

        {/* Code */}
        <div className={`${panel} min-w-0 p-2`}>
          <p className={heading}>Code</p>
          <CodeBlock label="tokens.css" lines={cssLines(resolved)} versions={versions} />
          <CodeBlock label="tokens.json" lines={jsonLines(resolved)} versions={versions} />
        </div>
      </div>
      <figcaption className="mt-1 font-mono text-xs text-muted">
        Move a slider. The preview and both code files change from the same value.
      </figcaption>
    </figure>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  valueText,
  onChange,
  trackStyle,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  valueText?: string;
  onChange: (value: number) => void;
  trackStyle?: CSSProperties;
}) {
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex items-baseline justify-between gap-1 text-xs">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="font-mono text-muted">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText ?? display}
        onChange={(e) => onChange(Number(e.target.value))}
        style={trackStyle}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg accent-accent [&::-moz-range-thumb]:size-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-surface [&::-webkit-slider-thumb]:size-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-surface"
      />
    </div>
  );
}

function CodeBlock({
  label,
  lines,
  versions,
}: {
  label: string;
  lines: Line[];
  versions: Partial<Record<keyof Resolved, number>>;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-0.5 font-mono text-xs text-muted">{label}</p>
      <pre className="overflow-x-auto rounded-md bg-bg py-1 font-mono text-xs">
        <code>
          {lines.map((line, i) => {
            const version = line.key ? versions[line.key] : undefined;
            return (
              <span
                // A new version remounts the line and replays the flash.
                key={`${i}-${version ?? 0}`}
                data-flash={version ? "" : undefined}
                className="block px-1 whitespace-pre"
              >
                {line.text}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
