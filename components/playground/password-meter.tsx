"use client";

import { useId, useState } from "react";

// Heuristic only (length, variety, common words, repeats). It runs locally
// and sends nothing anywhere. A real product should use zxcvbn or similar.
const COMMON = ["password", "123456", "qwerty", "letmein", "admin", "welcome", "iloveyou", "111111", "abc123"];
const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

function hasRunOrRepeat(pw: string) {
  if (/(.)\1{2,}/.test(pw)) return true;
  const s = pw.toLowerCase();
  for (let i = 0; i < s.length - 2; i++) {
    const [a, b, c] = [s.charCodeAt(i), s.charCodeAt(i + 1), s.charCodeAt(i + 2)];
    if (b - a === 1 && c - b === 1) return true; // abc, 123
  }
  return false;
}

function assess(pw: string) {
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const checks = {
    length: pw.length >= 12,
    variety: variety >= 3,
    pattern: pw.length > 0 && !COMMON.some((w) => pw.toLowerCase().includes(w)) && !hasRunOrRepeat(pw),
  };
  let score = 0;
  if (pw.length >= 8) score++;
  if (checks.length) score++;
  if (checks.variety) score++;
  if (pw.length >= 16) score++;
  if (pw.length >= 8 && !checks.pattern) score = Math.min(score, 1);
  return { score, checks };
}

export function PasswordMeter() {
  const id = useId();
  const [pw, setPw] = useState("");
  const [visible, setVisible] = useState(false);
  const { score, checks } = assess(pw);

  const rules = [
    { ok: checks.length, text: "12 or more characters" },
    { ok: checks.variety, text: "3 of: lowercase, uppercase, number, symbol" },
    { ok: checks.pattern, text: "No common words, runs, or repeats" },
  ];

  return (
    <div>
      <label htmlFor={id} className="mb-0.5 block font-mono text-xs text-muted">
        Password
      </label>
      <div className="flex gap-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          aria-describedby={`${id}-strength`}
          className="h-5 min-w-0 flex-1 rounded-md border border-line bg-bg px-1 font-mono text-sm transition-colors duration-150 ease-standard hover:border-muted focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="press h-5 rounded-md border border-line px-1 font-mono text-xs text-muted transition-[color,border-color] duration-150 ease-standard hover:border-ink hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      <div aria-hidden="true" className="mt-1 grid grid-cols-4 gap-0.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-0.5 rounded-md transition-colors duration-250 ease-standard ${score >= n ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>
      <p id={`${id}-strength`} aria-live="polite" className="mt-0.5 font-mono text-xs">
        {pw ? LABELS[score] : "Type to check"}
      </p>

      <ul className="mt-1 space-y-0.5 text-xs">
        {rules.map((r) => (
          <li key={r.text} className={`flex items-center gap-0.5 ${r.ok ? "text-ink" : "text-muted"}`}>
            <span aria-hidden="true" className="w-1.5 font-mono">
              {r.ok ? "✓" : "·"}
            </span>
            <span>
              {r.text}
              <span className="sr-only">{r.ok ? " (met)" : " (not met)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
