"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { site } from "@/lib/site";
import { CopyButton } from "./copy-button";
import { ScrambleLink } from "./scramble-link";

export type MenuCase = {
  slug: string;
  name: string;
  problem: string;
  role?: string;
  cover?: string;
};

type Props = {
  cases: MenuCase[];
  pages: { href: string; label: string }[];
  experiments: string[];
  contact: { email: string; linkedinUrl: string; resumeUrl?: string };
};

type Phase = "closed" | "enter" | "open" | "leaving";

const LEAVE_MS = 250;

// Full-screen side menu in the spirit of Metalab's: the "Menu" button turns
// into "Close", and three columns slide in one after another (pages and case
// studies, a large cover preview that follows the hovered case, then
// playground and contact). Esc closes it, Tab stays inside it, and focus
// returns to the button. The page underneath is never scroll-locked.
export function SiteMenu({ cases, pages, experiments, contact }: Props) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [preview, setPreview] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const open = phase === "enter" || phase === "open";

  const openMenu = () => {
    setPhase("enter");
    // Two frames: mount hidden first, then flip to open so transitions run.
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("open")));
  };

  const closeMenu = useCallback((returnFocus = true) => {
    setPhase("leaving");
    window.setTimeout(() => {
      setPhase("closed");
      if (returnFocus) button.current?.focus();
    }, LEAVE_MS);
  }, []);

  useEffect(() => {
    if (phase === "open") panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [phase]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Following a link: close without stealing focus back to the button.
  const go = () => closeMenu(false);

  const shown = phase === "open";
  const column = (delay: number) => ({
    className: `transition-[opacity,translate] duration-400 ease-standard ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`,
    style: { transitionDelay: shown ? `${delay}ms` : "0ms" },
  });

  return (
    <>
      <MenuButton ref={button} open={false} onClick={openMenu} />

      {phase !== "closed" &&
        createPortal(
          <div
            ref={panel}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onKeyDown={onKeyDown}
            className={`fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-bg transition-opacity duration-250 ease-standard ${phase === "enter" || phase === "leaving" ? "opacity-0" : "opacity-100"}`}
          >
            <div className="mx-auto flex max-w-page items-center justify-between px-2 py-2 md:px-4">
              <MenuButton open onClick={() => closeMenu()} autoFocus />
              <Link href="/" onClick={go} className="text-sm font-medium">
                {site.name}
              </Link>
              <span className="w-[84px]" aria-hidden="true" />
            </div>

            <div className="mx-auto grid max-w-page gap-6 px-2 pt-4 pb-12 md:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)] lg:gap-4 lg:pt-8">
              {/* Pages and case studies */}
              <div {...column(0)}>
                <nav aria-label="Pages">
                  <ul className="mb-6 space-y-0.5">
                    {pages.map((p) => (
                      <li key={p.href}>
                        <ScrambleLink
                          href={p.href}
                          label={p.label}
                          onClick={go}
                          className="text-xl tracking-tight text-ink hover:text-accent"
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
                <p className="mb-1 font-mono text-xs text-muted">Case studies</p>
                <ul className="flex flex-wrap gap-0.5">
                  {cases.map((c, i) => (
                    <li key={c.slug}>
                      <Link
                        href={`/work/${c.slug}/`}
                        onClick={go}
                        onMouseEnter={() => setPreview(i)}
                        onFocus={() => setPreview(i)}
                        className={`group flex items-center gap-0.5 rounded-md border px-1 py-0.5 text-sm transition-colors duration-150 ease-standard ${preview === i ? "border-ink" : "border-line hover:border-ink"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-1 rounded-md bg-accent transition-transform duration-250 ease-standard ${preview === i ? "scale-100" : "scale-0"}`}
                        />
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Large preview that follows the hovered / focused case */}
              <div {...column(150)}>
                <Link
                  href={`/work/${cases[preview]?.slug}/`}
                  onClick={go}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="group block"
                >
                  <div className="relative aspect-[2/1] overflow-clip rounded-md border border-line bg-surface">
                    {cases.map((c, i) =>
                      c.cover ? (
                        <Image
                          key={c.slug}
                          src={c.cover}
                          alt=""
                          width={1600}
                          height={800}
                          sizes="(min-width: 1024px) 560px, 100vw"
                          className={`absolute inset-0 size-full object-cover transition-[opacity,scale] duration-400 ease-standard group-hover:scale-[1.02] ${preview === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
                        />
                      ) : null,
                    )}
                  </div>
                </Link>
                <div className="mt-2 grid">
                  {cases.map((c, i) => (
                    // Captions share one grid cell and crossfade, so height never jumps.
                    <div
                      key={c.slug}
                      aria-hidden={preview !== i}
                      className={`col-start-1 row-start-1 transition-opacity duration-250 ease-standard ${preview === i ? "opacity-100" : "opacity-0"}`}
                    >
                      <p className="font-mono text-xs text-muted">
                        {String(i + 1).padStart(2, "0")} {c.role ? `· ${c.role}` : ""}
                      </p>
                      <p className="text-base">{c.problem}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playground and contact */}
              <div {...column(250)} className={`${column(250).className} space-y-2`}>
                <Link
                  href="/playground/"
                  onClick={go}
                  className="lift block rounded-md border border-line bg-surface p-2"
                >
                  <p className="mb-1 font-mono text-xs text-muted">Playground</p>
                  <ul className="space-y-0.5 text-sm">
                    {experiments.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </Link>
                <div className="lift rounded-md border border-line bg-surface p-2">
                  <p className="mb-1 font-mono text-xs text-muted">Contact</p>
                  <div className="flex flex-wrap items-center gap-1 text-sm">
                    {contact.email && <CopyButton value={contact.email} label="Copy email" />}
                    {contact.linkedinUrl && (
                      <a href={contact.linkedinUrl} className="link text-accent">
                        LinkedIn
                      </a>
                    )}
                    {contact.resumeUrl && (
                      <a href={contact.resumeUrl} className="link text-accent">
                        Resume
                      </a>
                    )}
                    {/* TODO: shows nothing until site.email / linkedinUrl / resume are set. */}
                    {!contact.email && !contact.linkedinUrl && !contact.resumeUrl && (
                      <Link href="/#contact" onClick={go} className="link text-accent">
                        Get in touch
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <span className="sr-only" aria-live="polite">
        {open ? "Menu open" : ""}
      </span>
    </>
  );
}

function MenuButton({
  open,
  onClick,
  ref,
  autoFocus,
}: {
  open: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  autoFocus?: boolean;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      data-autofocus={autoFocus ? "" : undefined}
      aria-expanded={open}
      aria-controls={open ? "site-menu" : undefined}
      className="group press inline-flex h-4 w-[84px] items-center gap-1 rounded-md border border-line bg-surface px-1 font-mono text-xs transition-colors duration-150 ease-standard hover:border-ink"
    >
      <span aria-hidden="true" className="relative block h-1 w-1.5">
        <span
          className={`absolute left-0 h-px w-full bg-current transition-[top,rotate] duration-250 ease-standard ${open ? "top-1/2 rotate-45" : "top-0"}`}
        />
        <span
          className={`absolute left-0 h-px w-full bg-current transition-[top,rotate] duration-250 ease-standard ${open ? "top-1/2 -rotate-45" : "top-full"}`}
        />
      </span>
      {open ? "Close" : "Menu"}
    </button>
  );
}
