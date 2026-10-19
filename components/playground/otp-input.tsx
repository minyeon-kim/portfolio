"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { CopyButton } from "@/components/copy-button";

const LENGTH = 6;
const DEMO_CODE = "204816";

// Six boxes that behave like one field: typing moves forward, Backspace
// moves back, arrows move freely, and pasting anywhere fills from there.
export function OtpInput() {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => inputs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const fill = (start: number, text: string) => {
    const incoming = text.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!incoming.length) return;
    const next = [...digits];
    incoming.forEach((d, k) => (next[start + k] = d));
    setDigits(next);
    focus(start + incoming.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      focus(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  };

  const code = digits.join("");
  const complete = code.length === LENGTH;
  const status = !complete ? "idle" : code === DEMO_CODE ? "ok" : "wrong";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="font-mono text-xs text-muted">
          Demo code <span className="text-ink">{DEMO_CODE.slice(0, 3)} {DEMO_CODE.slice(3)}</span>
        </p>
        <CopyButton value={DEMO_CODE} />
      </div>

      <div role="group" aria-label="Verification code" className="flex gap-0.5">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v.length > 1) return fill(i, v); // autofill or IME delivers several digits
              const next = [...digits];
              next[i] = v;
              setDigits(next);
              if (v) focus(i + 1);
            }}
            data-status={status}
            className={`h-5 w-full min-w-0 rounded-md border bg-bg text-center font-mono text-lg transition-colors duration-150 ease-standard ${status === "ok" ? "border-accent" : "border-line"} ${i === 2 ? "mr-1" : ""}`}
          />
        ))}
      </div>

      <div className="mt-1 flex min-h-4 items-center justify-between gap-1">
        <p role="status" className="font-mono text-xs">
          {status === "ok" && <span className="text-accent">Verified</span>}
          {status === "wrong" && "That code doesn't match. Try again."}
          {status === "idle" && <span className="text-muted">Type or paste the code</span>}
        </p>
        {code && (
          <button
            type="button"
            onClick={() => {
              setDigits(Array(LENGTH).fill(""));
              focus(0);
            }}
            className="font-mono text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
