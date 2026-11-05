import { StyleRetry } from "@/components/style-retry";
import type { Metadata } from "next";
import { HtmlLang } from "@/components/html-lang";
import { ViewTransition } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono, Newsreader, Noto_Serif_KR } from "next/font/google";
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

// The landing statement: a thin display serif, after Metalab's PP Eiko.
const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// Its Hangul. Loaded in slices only where Korean text uses it, so never preloaded.
const serifKo = Noto_Serif_KR({
  variable: "--font-serif-ko",
  subsets: ["latin"],
  weight: ["200"],
  display: "swap",
  preload: false,
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
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable} ${serifKo.variable} h-full antialiased`}
    >
      <head>
        <StyleRetry />
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col text-sm">
        <SiteHeader />
        <main className="flex-1">
          {/* Route changes crossfade (View Transitions; static where unsupported). */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        <HtmlLang />
        <RevealObserver />
        <SmoothScroll />
        <ReturnToIntro />
      </body>
    </html>
  );
}
