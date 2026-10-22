import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-2 py-4 font-mono text-xs text-muted md:px-4">
        <p>{site.name}</p>
        <ul className="flex gap-3">
          <li>
            <a href={site.email ? `mailto:${site.email}` : "#"} className="link transition-colors duration-150 ease-standard hover:text-ink">
              Email
            </a>
          </li>
          <li>
            <a href={site.linkedinUrl || "#"} className="link transition-colors duration-150 ease-standard hover:text-ink">
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
