"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
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

const GROW = 650;

// After metalab.com: Menu shrinks the page you're on into a card in the middle of a
// white screen (the page keeps running in it), with the links sliding in from the left
// and the quieter ones from the right. Pointing at a case or About shows it in the card;
// following a link grows the new page back out of the card. Below 64rem it's a plain sheet.
export function SiteMenu({ contact, cases }: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const locale = localeOf(pathname);
  const t = ui[locale];
  const list = cases[locale];
  const path = stripLocale(pathname);
  const current = path.match(/^\/work\/([^/]+)/)?.[1];
  const [shown, setShown] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(undefined);
  const wasPath = useRef(pathname);

  const begin = () => {
    window.clearTimeout(timer.current);
    setShown(null);
    setLeaving(false);
    setMounted(true);
    setOpen(true);
  };
  const end = useCallback((refocus = false) => {
    window.clearTimeout(timer.current);
    setOpen(false);
    setLeaving(false);
    if (refocus) button.current?.focus({ preventScroll: true });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(() => setMounted(false), still ? 0 : GROW);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    setUi({ menuOpen: open });
    return () => setUi({ menuOpen: false });
  }, [open]);

  // The new page is in place: grow it out of the card.
  useEffect(() => {
    if (wasPath.current === pathname) return;
    wasPath.current = pathname;
    if (!open) return;
    window.scrollTo(0, 0);
    end();
  }, [pathname, open, end]);

  // The page's scale and where it's held. It keeps scrolling inside the card, so its
  // centre follows the scroll; the card itself is laid out in CSS (top 72, bottom 32).
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const main = document.querySelector("main");
    const opener = main?.querySelector(".devsign-hero-panel");
    const openerTop = opener ? opener.getBoundingClientRect().top + window.scrollY : 0;
    const place = () => {
      const height = window.innerHeight;
      const scale = (height - 104) / height;
      html.style.setProperty("--menu-s", String(scale));
      // A case opener starts below the header strip; hold it at the card's top edge, so
      // the strip doesn't sit in the card as a dark band. It lets go as the page scrolls.
      html.style.setProperty("--menu-y", `${20 - Math.max(0, openerTop - window.scrollY) * scale}px`);
      if (main) main.style.transformOrigin = `50% ${window.scrollY + height / 2 - main.offsetTop}px`;
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
      html.removeAttribute("data-menu");
      if (main) main.style.transformOrigin = "";
    };
  }, [mounted]);
  useEffect(() => {
    if (!mounted) return;
    // One frame at full size first, so the shrink has somewhere to start from.
    const html = document.documentElement;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => html.setAttribute("data-menu", open ? "open" : "closing")));
    return () => cancelAnimationFrame(frame);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) end();
    };
    const keys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        end(true);
        return;
      }
      if (event.key !== "Tab") return;
      // Tab stays in the sheet and its button.
      const stops = [button.current, ...(sheet.current?.querySelectorAll<HTMLElement>(".menu-column a, .menu-side a") ?? [])].filter((el): el is HTMLElement => Boolean(el));
      const at = stops.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : (at + 1) % stops.length;
      event.preventDefault();
      stops[next]?.focus();
    };
    const dismiss = () => end();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keys);
    window.addEventListener("popstate", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keys);
      window.removeEventListener("popstate", dismiss);
    };
  }, [open, end]);

  // A link to another page waits in the card until that page is there; anything else
  // just closes. The timer covers a route that doesn't change the path (home stage).
  const follow = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as Element).closest("a");
    if (!link) return;
    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("/") && !link.hasAttribute("aria-current")) {
      setLeaving(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => end(), 1200);
    } else end();
  };
  const targetOf = (key: string) => (key === "about" ? localize("/about/", locale) : localize(`/work/${key}/`, locale));

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
        onClick={() => (open ? end() : begin())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          begin();
          requestAnimationFrame(() => requestAnimationFrame(() => sheet.current?.querySelector<HTMLAnchorElement>(".menu-column a")?.focus()));
        }}
      >
        <span aria-hidden="true" className="header-menu-label">{open ? `${t.close} ×` : t.menu}</span>
      </button>
      {mounted && (
        <div ref={sheet} id="site-menu" role="dialog" aria-modal="true" aria-label={t.siteNav} className="menu-sheet" onClick={follow} data-leaving={leaving || undefined}>
          <div className="menu-window" aria-hidden="true">
            {list.map((c) => (
              <Link key={c.slug} href={targetOf(c.slug)} tabIndex={-1} className="menu-card" data-project={c.slug} data-on={shown === c.slug || undefined}>
                {c.slug === "devsign"
                  ? <span className="home-device-window"><DevsignLoop alt="" /></span>
                  : c.slug === "gemini-privacy"
                    ? <span className="home-device-phone"><GeminiDevice><GeminiPhone alt="" /></GeminiDevice></span>
                    : null}
              </Link>
            ))}
            <Link href={targetOf("about")} tabIndex={-1} className="menu-card" data-project="about" data-on={shown === "about" || undefined}>
              <Image src={withBase("/images/about/portrait.webp")} alt="" fill sizes="30vw" />
            </Link>
            {!shown && <button type="button" tabIndex={-1} className="menu-card-close" onClick={() => end()} />}
          </div>
          <nav className="menu-column" aria-label={t.siteNav} lang={locale}>
            <ul className="menu-links">
              <li><HomeLink>{t.home}</HomeLink></li>
              <li onMouseEnter={() => setShown("about")} onFocus={() => setShown("about")}><Link href={localize("/about/", locale)} aria-current={path === "/about/" ? "page" : undefined}>{t.about}</Link></li>
              {contact.email && <li><a href={`mailto:${contact.email}`}>{t.getInTouch}</a></li>}
            </ul>
            <p className="menu-label">{t.caseStudiesLabel}</p>
            <ol className="menu-picks">
              {list.map((c) => (
                <li key={c.slug}>
                  <Link href={targetOf(c.slug)} aria-current={c.slug === current ? "page" : undefined} onMouseEnter={() => setShown(c.slug)} onFocus={() => setShown(c.slug)}>{c.name}</Link>
                </li>
              ))}
            </ol>
          </nav>
          <ul className="menu-side">
            {contact.linkedinUrl && <li><a href={contact.linkedinUrl}>LinkedIn ↗</a></li>}
            <li><Link href={localize("/playground/", locale)} aria-current={path === "/playground/" ? "page" : undefined}>{t.playground}</Link></li>
            {contact.resumeUrl && <li><a href={withBase(contact.resumeUrl)}>{t.resume} ↗</a></li>}
          </ul>
        </div>
      )}
    </div>
  );
}
