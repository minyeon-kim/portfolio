"use client";

import { localize } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import Link from "next/link";
import { Children, useEffect, useState, type ReactNode } from "react";
import { setUi, useUi } from "@/lib/ui-store";
import { withBase } from "@/lib/site";

// Below the stage: the selected case's full content, so scrolling down reads
// straight into it. Nothing is mounted until a case is picked (the intro has
// nothing below it). Only the selected case is mounted (no duplicate heading
// ids); the others arrive with the page and swap in instantly.
// Picked from the intro, the case opens with a zoom into its opener; mounting
// the whole case under it is a long task that froze the zoom mid-way. So the
// content waits until the transition is over and the browser is idle (the
// opener fills the screen, nothing below it shows meanwhile).
export function CasePanels({ children }: { children: ReactNode }) {
  const active = useUi((s) => s.activeCase);
  const panels = Children.toArray(children);
  const [mounted, setMounted] = useState<number | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    if (active === null || active === mounted || !root.hasAttribute("data-project-navigation")) return;
    let idle = 0;
    const mount = () => {
      const run = () => setMounted(active);
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(run, { timeout: 400 }) : Number(globalThis.setTimeout(run, 50));
    };
    const observer = new MutationObserver(() => {
      if (root.hasAttribute("data-project-navigation")) return;
      observer.disconnect();
      mount();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-project-navigation"] });
    return () => {
      observer.disconnect();
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, [active, mounted]);
  // Read during render on purpose: the flag is set before the case is picked.
  const waiting = active !== mounted && typeof document !== "undefined" && document.documentElement.hasAttribute("data-project-navigation");
  if (active === null || waiting) return null;
  return (
    <>
      <div id="case" key={active} className="scroll-mt-4 md:scroll-mt-1">
        {panels[active]}
      </div>
    </>
  );
}

// Header name on the landing page: back to the intro, at the top.
export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const home = localize("/", useLocale());
  return (
    <Link
      href={home}
      className={className}
      onClick={(e) => {
        if (window.location.pathname !== withBase(home)) return;
        e.preventDefault();
        setUi({ activeCase: null, menuOpen: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}

