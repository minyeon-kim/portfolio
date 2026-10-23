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
      className="header-menu-trigger theme-toggle press relative"
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

// Same line weight and size as the menu icon (1px lines, 14px wide).
function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path
        d="M7 .5v1.5M7 12v1.5M.5 7H2M12 7h1.5M2.4 2.4l1.06 1.06M10.54 10.54l1.06 1.06M2.4 11.6l1.06-1.06M10.54 3.46l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.5 8.4A5.5 5.5 0 0 1 5.6 1.5a5.5 5.5 0 1 0 6.9 6.9Z"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
