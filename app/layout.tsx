import { StyleRetry } from "@/components/style-retry";
import type { Metadata } from "next";
import { HtmlLang } from "@/components/html-lang";
import { ViewTransition } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import { ReturnToIntro } from "@/components/return-to-intro";
import { RevealObserver } from "@/components/reveal-observer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/site-header";
import { ThemeScript } from "@/components/theme-script";
import { shareMeta, site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Every big title (owner, after the 2026-11-10 class feedback): Nunito Sans, the free face
// closest to the Avenir the teacher suggested.
const landingSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-landing",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${site.name} — Product Designer`, template: `%s — ${site.name}` },
  description: site.positioning,
  ...shareMeta("/", `${site.name} — Product Designer`, site.positioning),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script may set data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${landingSans.variable} h-full antialiased`}
    >
      <head>
        <StyleRetry />
        {/* Hangul in the sans stack: Pretendard, loaded in unicode-range slices, so only
            the Korean glyphs a page actually shows are fetched; Latin stays Geist. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col text-sm">
        <SiteHeader />
        <main className="flex-1">
          {/* Route changes crossfade (View Transitions; static where unsupported). */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        {/* White panels: the page opens out of a thin line on load and between pages (metalab.com). */}
        <div className="page-curtain" aria-hidden="true">
          <i data-p="l" /><i data-p="r" /><i data-p="t" /><i data-p="b" /><i data-c="tl" /><i data-c="tr" /><i data-c="bl" /><i data-c="br" />
        </div>
        <HtmlLang />
        <RevealObserver />
        <SmoothScroll />
        <ReturnToIntro />
      </body>
    </html>
  );
}
