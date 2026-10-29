"use client";

import { useEffect, useRef, useState } from "react";
import { DevsignLoop } from "@/components/devsign-loop";
import { useLocale } from "@/lib/use-locale";

// The real Devsign prototype (github.com/minyeon-kim/devsign, served from
// GitHub Pages), as published.
export const DEVSIGN_URL = "https://minyeon-kim.github.io/devsign/";
const VIRTUAL_WIDTH = 1440;

// The prototype honours ?lang=en|ko for the load (src/i18n/language.js in the
// devsign repo), so it opens in the site's language on any origin.
export function devsignUrl(locale: "en" | "ko") {
  return `${DEVSIGN_URL}?lang=${locale}`;
}

// The prototype keeps its language in localStorage under this key (see
// src/i18n/language.js in the devsign repo) and listens for storage changes.
// On GitHub Pages the portfolio and the prototype share an origin
// (minyeon-kim.github.io), so writing it here also switches loaded frames live
// when the site language changes; the URL parameter covers the first load.
const DEVSIGN_LANGUAGE_KEY = "devsign:preferences:v1";
export function setDevsignLanguage(locale: "en" | "ko") {
  try { localStorage.setItem(DEVSIGN_LANGUAGE_KEY, JSON.stringify({ version: 1, language: locale })); } catch { /* storage unavailable: the prototype keeps its default */ }
}

// The live prototype in a frame, laid out at its desktop width (1440) and
// scaled to fill whatever box it sits in, so it shows its real UI at any
// browser size. The image loop stands in underneath until the page has
// loaded, then the frame fades in over it. Not interactive here (the chrome
// bar links to the prototype itself).
export function DevsignLive({ alt }: { alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const locale = useLocale();
  // Before the frame requests the page, so it opens in the site's language.
  useEffect(() => { setDevsignLanguage(locale); }, [locale]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const scale = rect.width / VIRTUAL_WIDTH;
      el.style.setProperty("--live-scale", String(scale));
      el.style.setProperty("--live-h", `${rect.height / scale}px`);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} className="devsign-live" data-loaded={loaded || undefined}>
      <DevsignLoop alt={alt} />
      <iframe src={devsignUrl(locale)} title="Devsign prototype" tabIndex={-1} aria-hidden="true" sandbox="allow-scripts allow-same-origin" onLoad={() => setLoaded(true)} />
    </div>
  );
}
