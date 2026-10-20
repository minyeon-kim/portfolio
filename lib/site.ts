// Single place for identity and contact details used by the header and footer.
// TODO: replace every placeholder below with real values before launch.
export const site = {
  name: "Minyeon Kim",
  positioning:
    "Product designer with a background in cybersecurity — connecting research, design, and engineering to bring ideas to life with AI.",
  resumeUrl: "/resume.pdf", // TODO: add public/resume.pdf
  email: "", // TODO: contact email
  linkedinUrl: "", // TODO: LinkedIn profile URL
};

export const nav = [
  { href: "/#work", label: "Work" },
  { href: "/playground/", label: "Playground" },
  { href: "/about/", label: "About" },
  { href: "/#contact", label: "Contact" },
];

// Prefixes a /public path with the deploy base path (e.g. /portfolio on GitHub Pages).
// next/image and plain <a> tags don't add it on their own for static export.
export const withBase = (src: string) =>
  src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;
