"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { withBase } from "@/lib/site";
import { setUi } from "@/lib/ui-store";
import { HomeLink } from "@/components/home/case-panels";

// Site-wide navigation only. Projects are picked on the landing page and
// linked from the end of each case, so the menu doesn't repeat them.
type Props = {
  contact: { email: string; linkedinUrl: string; resumeUrl?: string };
};

export function SiteMenu(props: Props) {
  const pathname = usePathname();
  return <MenuPanel key={pathname} {...props} pathname={pathname} />;
}

function MenuPanel({ contact, pathname }: Props & { pathname: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    setUi({ menuOpen: open });
    return () => setUi({ menuOpen: false });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      button.current?.focus({ preventScroll: true });
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("popstate", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("popstate", dismiss);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div ref={root} className="header-menu" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) close();
    }}>
      <button
        ref={button}
        id="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="header-menu-trigger press"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => panel.current?.querySelector<HTMLAnchorElement>("a")?.focus());
        }}
      >
        <span aria-hidden="true" className="header-menu-icon" data-open={open || undefined}><span /><span /></span>
      </button>
      {open && (
        <nav ref={panel} id="site-menu" aria-label="Site navigation" className="header-menu-panel">
          <ul className="header-menu-pages">
            <li onClick={close}><HomeLink>Work</HomeLink></li>
            <li><Link href="/about/" onClick={close} aria-current={pathname === "/about/" ? "page" : undefined}>About</Link></li>
          </ul>
          {(contact.email || contact.linkedinUrl || contact.resumeUrl) && <div className="header-menu-contact">
            {contact.email && <a href={`mailto:${contact.email}`} onClick={close}>Email ↗</a>}
            {contact.linkedinUrl && <a href={contact.linkedinUrl} onClick={close}>LinkedIn ↗</a>}
            {contact.resumeUrl && <a href={withBase(contact.resumeUrl)} onClick={close}>Resume ↗</a>}
          </div>}
        </nav>
      )}
    </div>
  );
}
