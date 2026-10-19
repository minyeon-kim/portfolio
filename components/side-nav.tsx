"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useActiveSection } from "@/lib/use-active-section";

type Item = { key: string; href: string; label: string; icon: ReactNode };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ITEMS: Item[] = [
  {
    key: "work",
    href: "/#work",
    label: "Work",
    icon: (
      <svg viewBox="0 0 20 20" className="size-2.5" aria-hidden="true">
        <rect x="3" y="3" width="6" height="6" rx="1.5" {...stroke} />
        <rect x="11" y="3" width="6" height="6" rx="1.5" {...stroke} />
        <rect x="3" y="11" width="6" height="6" rx="1.5" {...stroke} />
        <rect x="11" y="11" width="6" height="6" rx="1.5" {...stroke} />
      </svg>
    ),
  },
  {
    key: "playground",
    href: "/playground/",
    label: "Playground",
    icon: (
      <svg viewBox="0 0 20 20" className="size-2.5" aria-hidden="true">
        <path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3M4.7 4.7l2.1 2.1M13.2 13.2l2.1 2.1M4.7 15.3l2.1-2.1M13.2 6.8l2.1-2.1" {...stroke} />
      </svg>
    ),
  },
  {
    key: "about",
    href: "/about/",
    label: "About",
    icon: (
      <svg viewBox="0 0 20 20" className="size-2.5" aria-hidden="true">
        <circle cx="10" cy="7" r="3.5" {...stroke} />
        <path d="M3.5 17c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" {...stroke} />
      </svg>
    ),
  },
  {
    key: "contact",
    href: "/#contact",
    label: "Contact",
    icon: (
      <svg viewBox="0 0 20 20" className="size-2.5" aria-hidden="true">
        <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" {...stroke} />
        <path d="m3 5.5 7 5.5 7-5.5" {...stroke} />
      </svg>
    ),
  },
];

// Floating side navigation in the style of Metalab / Brand Appart: a column
// of tiles fixed to the left edge on wide screens. Hover or focus slides a
// label out; the tile for the current page (or, on the landing page, the
// section in view) is filled. Hidden where it would overlap the content;
// the Menu button covers those widths.
export function SideNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const section = useActiveSection(["intro", "work", "playground", "about", "contact"]);

  const current = onHome
    ? section === "intro"
      ? null
      : section
    : pathname.startsWith("/work/")
      ? "work"
      : pathname.startsWith("/playground")
        ? "playground"
        : pathname.startsWith("/about")
          ? "about"
          : null;

  return (
    <nav
      aria-label="Site"
      className="fixed top-1/2 left-2 z-20 hidden -translate-y-1/2 min-[1360px]:block"
    >
      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = current === item.key;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? (onHome ? "location" : "page") : undefined}
                className={`group press relative flex size-7 items-center justify-center rounded-md transition-[background-color,color,scale] duration-250 ease-standard hover:scale-105 ${
                  active ? "bg-ink text-bg" : "bg-fill text-muted backdrop-blur-md hover:bg-fill-strong hover:text-ink"
                }`}
              >
                {item.icon}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-full ml-1 -translate-x-1 rounded-full bg-ink px-1.5 py-0.5 text-bg font-mono text-xs whitespace-nowrap opacity-0 transition-[opacity,translate] duration-250 ease-standard group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                >
                  {item.label}
                </span>
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
