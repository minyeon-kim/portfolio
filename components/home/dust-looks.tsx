"use client";

import { useEffect, useState } from "react";

// Temporary: a quiet row in the Menu for trying the landing form options one by one.
// Remove it, with the `look` uniform in hero-object.tsx, once a form is chosen.
export const DUST_LOOK_EVENT = "dust-look";
const KEY = "dust-look";
const LOOKS = ["Now", "Ring", "Torus", "Sphere", "Planet", "Gyro"];

export function readDustLook() {
  try { const v = Number(sessionStorage.getItem(KEY)); return v >= 0 && v <= 5 ? Math.floor(v) : 0; } catch { return 0; }
}

export function DustLooks() {
  const [look, setLook] = useState(0);
  useEffect(() => { setLook(readDustLook()); }, []);
  const pick = (next: number) => {
    setLook(next);
    try { sessionStorage.setItem(KEY, String(next)); } catch {}
    window.dispatchEvent(new CustomEvent(DUST_LOOK_EVENT, { detail: next }));
  };
  return (
    <div className="menu-dust" role="group" aria-label="Landing particle options">
      {LOOKS.map((name, i) => <button key={name} type="button" aria-pressed={look === i} onClick={() => pick(i)}>{name}</button>)}
    </div>
  );
}
