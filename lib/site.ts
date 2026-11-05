import type { Metadata } from "next";

// Single place for identity and contact details used by the header and footer.
// TODO: add public/resume.pdf before launch.
export const site = {
  name: "Minyeon Kim",
  positioning:
    "Designing complex products, end to end. Product designer who builds with AI, from research to a working prototype, with a background in cybersecurity.",
  resumeUrl: "/resume.pdf", // TODO: add public/resume.pdf
  email: "minyeon.kim3@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/minyeon-kim-56b21228a/",
};

export const nav = [
  { href: "/#work", label: "Work" },
  { href: "/playground/", label: "Playground" },
  { href: "/about/", label: "About" },
  { href: "/#contact", label: "Contact" },
];

// The real Devsign prototype (github.com/minyeon-kim/devsign, served from GitHub
// Pages). It honours ?lang=en|ko for the load (src/i18n/language.js in that repo).
export const DEVSIGN_URL = "https://minyeon-kim.github.io/devsign/";
export const devsignUrl = (locale: "en" | "ko") => `${DEVSIGN_URL}?lang=${locale}`;

// Prefixes a /public path with the deploy base path (e.g. /portfolio on GitHub Pages).
// next/image and plain <a> tags don't add it on their own for static export.
export const withBase = (src: string) =>
  src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;

// Where the site lives, for absolute links in shared previews. Change this one
// value when the custom domain is connected.
export const siteUrl = "https://minyeon-kim.github.io/portfolio";

// What LinkedIn, Slack and mail show for a shared link. Images are in /public/og
// (1200x630, captured from the pages themselves).
export function shareMeta(pagePath: string, title: string, description: string, image = "home"): Pick<Metadata, "openGraph" | "twitter"> {
  const url = `${siteUrl}/og/${image}.png`;
  return {
    openGraph: { type: "website", siteName: site.name, title, description, url: `${siteUrl}${pagePath}`, images: [{ url, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [url] },
  };
}
