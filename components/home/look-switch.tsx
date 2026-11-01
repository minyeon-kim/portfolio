"use client";

import { useEffect, useState } from "react";

// Temporary: compares light-theme landing looks side by side. Shown only with
// ?v= in the URL (e.g. /?v=2); buttons or the 1–4 keys switch in place, and the choice
// is kept in the URL so a link or reload opens the same look. Remove once a
// look is chosen.
const LOOKS = [
  { id: "1", label: "Now" },
  { id: "2", label: "A Pearl" },
  { id: "3", label: "B Dawn" },
  { id: "4", label: "C White glow" },
];

export function LookSwitch() {
  const [look, setLook] = useState<string | null>(null);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v === null) return;
    setLook(LOOKS.some((l) => l.id === v) ? v : "1");
  }, []);

  useEffect(() => {
    if (look === null) return;
    document.documentElement.dataset.heroLook = look;
    const url = new URL(window.location.href);
    url.searchParams.set("v", look);
    window.history.replaceState(window.history.state, "", url);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey || target?.closest("input, textarea, [contenteditable]")) return;
      if (LOOKS.some((l) => l.id === event.key)) setLook(event.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [look]);

  useEffect(() => () => { delete document.documentElement.dataset.heroLook; }, []);

  if (look === null) return null;
  return (
    <div className="look-switch" role="group" aria-label="Compare light-theme looks">
      {LOOKS.map((l) => (
        <button key={l.id} type="button" aria-pressed={look === l.id} onClick={() => setLook(l.id)}>
          <span className="look-switch-key">{l.id}</span>{l.label}
        </button>
      ))}
    </div>
  );
}
