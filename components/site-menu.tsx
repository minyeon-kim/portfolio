"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { withBase } from "@/lib/site";
import { setUi } from "@/lib/ui-store";

export type MenuCase = { slug: string; name: string };
type Props = {
  cases: MenuCase[];
  contact: { email: string; linkedinUrl: string; resumeUrl?: string };
};

export function SiteMenu(props: Props) {
  const pathname = usePathname();
  return <MenuPanel key={pathname} {...props} pathname={pathname} />;
}

function MenuPanel({ cases, contact, pathname }: Props & { pathname: string }) {
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
        <span>Menu</span>
      </button>
      {open && (
        <nav ref={panel} id="site-menu" aria-label="Site navigation" className="header-menu-panel">
          <p className="header-menu-label">Projects <span>{String(cases.length).padStart(2, "0")}</span></p>
          <ul className="header-menu-projects">
            {cases.map((project) => (
              <li key={project.slug}>
                <Link href={`/work/${project.slug}/`} onClick={close}
                  aria-current={pathname === `/work/${project.slug}/` ? "page" : undefined}
                  className="header-menu-project" data-project={project.slug}>
                  <span className="header-menu-project-icon"><Image src={withBase(project.slug === "gemini-privacy" ? "/images/cases/gemini-privacy/gemini-logo.png" : "/images/cases/workflow-app/devsign-icon.svg")} alt="" width={22} height={22} /></span>
                  <span>{project.name}<small>View case study</small></span>
                  <span className="header-menu-arrow" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="header-menu-pages">
            <li><Link href="/about/" onClick={close} aria-current={pathname === "/about/" ? "page" : undefined}>About<span aria-hidden="true">↗</span></Link></li>
            <li><Link href="/playground/" onClick={close} aria-current={pathname === "/playground/" ? "page" : undefined}>Playground<span aria-hidden="true">↗</span></Link></li>
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
