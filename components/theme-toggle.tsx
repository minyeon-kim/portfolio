"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const query = "(prefers-color-scheme: dark)";

function getTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia(query).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    const apply = () => {
      // Picking the theme the system already uses clears the override,
      // so the site goes back to following the system.
      const system: Theme = window.matchMedia(query).matches ? "dark" : "light";
      try {
        if (next === system) {
          delete document.documentElement.dataset.theme;
          localStorage.removeItem("theme");
        } else {
          document.documentElement.dataset.theme = next;
          localStorage.setItem("theme", next);
        }
      } catch {
        document.documentElement.dataset.theme = next;
      }
    };

    // Crossfade the whole page between themes where supported.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && "startViewTransition" in document) document.startViewTransition(apply);
    else apply();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${next} theme` : "Toggle theme"}
      className="press relative inline-flex size-4 items-center justify-center rounded-full bg-fill text-muted transition-[color,background-color] duration-150 ease-standard hover:bg-fill-strong hover:text-ink md:group-data-compact/header:bg-transparent md:group-data-compact/header:hover:bg-transparent"
    >
      {/* Both icons stay mounted and swap with a quarter turn. */}
      <span
        className={`absolute transition-[opacity,rotate,scale] duration-250 ease-standard ${theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
      >
        <SunIcon />
      </span>
      <span
        className={`absolute transition-[opacity,rotate,scale] duration-250 ease-standard ${theme === "light" ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0"}`}
      >
        <MoonIcon />
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
