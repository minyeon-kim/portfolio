"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { HomeLink } from "@/components/home/case-panels";
import { withBase } from "@/lib/site";
import { setUi } from "@/lib/ui-store";
import { localeOf, localize, stripLocale, ui } from "@/lib/i18n";

type MenuCase = { slug: string; name: string };
type Props = {
  contact: { email: string; linkedinUrl: string; resumeUrl?: string };
  cases: { en: MenuCase[]; ko: MenuCase[] };
};

export function SiteMenu(props: Props) {
  const pathname = usePathname();
  return <MenuPanel key={pathname} {...props} pathname={pathname} />;
}

// The way around from any page, after metalab.com: Menu opens the landing's left
// column on a plain sheet, with the case under the pointer as a large card beside it.
function MenuPanel({ contact, cases, pathname }: Props & { pathname: string }) {
  const [open, setOpen] = useState(false);
  const locale = localeOf(pathname);
  const t = ui[locale];
  const list = cases[locale];
  const path = stripLocale(pathname);
  const current = path.match(/^\/work\/([^/]+)/)?.[1];
  const [hovered, setHovered] = useState<string | null>(null);
  const shown = hovered ?? (list.some((c) => c.slug === current) ? current : list[0]?.slug);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUi({ menuOpen: open });
    return () => setUi({ menuOpen: false });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const keys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        button.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab") return;
      // Tab stays in the sheet and its button.
      const stops = [button.current, ...(sheet.current?.querySelectorAll<HTMLElement>(".menu-column a") ?? [])].filter((el): el is HTMLElement => Boolean(el));
      const at = stops.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : (at + 1) % stops.length;
      event.preventDefault();
      stops[next]?.focus();
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keys);
    window.addEventListener("popstate", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keys);
      window.removeEventListener("popstate", dismiss);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div ref={root} className="header-menu">
      <button
        ref={button}
        id="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? t.closeMenu : t.openMenu}
        className="header-menu-trigger press"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => sheet.current?.querySelector<HTMLAnchorElement>(".menu-column a")?.focus());
        }}
      >
        <span aria-hidden="true" className="header-menu-label">{open ? `${t.close} ×` : t.menu}</span>
      </button>
      {open && (
        <div ref={sheet} id="site-menu" role="dialog" aria-modal="true" aria-label={t.siteNav} className="menu-sheet" onClick={(event) => {
          if ((event.target as Element).closest("a")) close();
        }}>
          <nav className="menu-column" aria-label={t.siteNav} lang={locale}>
            <ul className="menu-links">
              <li><HomeLink>{t.home}</HomeLink></li>
              <li><Link href={localize("/about/", locale)} aria-current={path === "/about/" ? "page" : undefined}>{t.about}</Link></li>
              {contact.email && <li><a href={`mailto:${contact.email}`}>{t.getInTouch}</a></li>}
            </ul>
            <p className="menu-label">{t.caseStudiesLabel}</p>
            <ol className="menu-picks" onMouseLeave={() => setHovered(null)}>
              {list.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={localize(`/work/${c.slug}/`, locale)}
                    aria-current={c.slug === current ? "page" : undefined}
                    onMouseEnter={() => setHovered(c.slug)}
                    onFocus={() => setHovered(c.slug)}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ol>
            <ul className="menu-more">
              {contact.linkedinUrl && <li><a href={contact.linkedinUrl}>LinkedIn ↗</a></li>}
              <li><Link href={localize("/playground/", locale)} aria-current={path === "/playground/" ? "page" : undefined}>{t.playground}</Link></li>
              {contact.resumeUrl && <li><a href={withBase(contact.resumeUrl)}>{t.resume} ↗</a></li>}
            </ul>
          </nav>
          <div className="menu-preview" aria-hidden="true">
            {list.map((c) => (
              <Link key={c.slug} href={localize(`/work/${c.slug}/`, locale)} tabIndex={-1} className="menu-card" data-project={c.slug} data-on={shown === c.slug || undefined}>
                {c.slug === "devsign"
                  ? <span className="home-device-window"><DevsignLoop alt="" /></span>
                  : c.slug === "gemini-privacy"
                    ? <span className="home-device-phone"><GeminiDevice><GeminiPhone alt="" /></GeminiDevice></span>
                    : null}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
