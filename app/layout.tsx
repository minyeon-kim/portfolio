import type { Metadata } from "next";
import { HtmlLang } from "@/components/html-lang";
import { ViewTransition } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ReturnToIntro } from "@/components/return-to-intro";
import { RevealObserver } from "@/components/reveal-observer";
import { SiteHeader } from "@/components/site-header";
import { ThemeScript } from "@/components/theme-script";
import { site } from "@/lib/site";
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
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s — ${site.name}` },
  description: site.positioning,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script may set data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <head>
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
        <ReturnToIntro />
      </body>
    </html>
  );
}
