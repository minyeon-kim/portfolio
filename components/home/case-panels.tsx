"use client";

import Link from "next/link";
import { Children, type ReactNode } from "react";
import { setUi, useUi } from "@/lib/ui-store";
import { withBase } from "@/lib/site";

// Below the stage: the selected case's full content, so scrolling down reads
// straight into it. Nothing is mounted until a case is picked (the intro has
// nothing below it). Only the selected case is mounted (no duplicate heading
// ids); the others arrive with the page and swap in instantly.
export function CasePanels({ children }: { children: ReactNode }) {
  const active = useUi((s) => s.activeCase);
  const panels = Children.toArray(children);
  if (active === null) return null;
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
  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (window.location.pathname !== withBase("/")) return;
        e.preventDefault();
        setUi({ activeCase: null, menuOpen: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}

