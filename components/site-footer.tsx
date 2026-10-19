import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-2 py-4 font-mono text-xs text-muted md:px-4">
        <p>{site.name}</p>
        <ul className="flex gap-3">
          <li>
            {/* TODO: set site.email in lib/site.ts */}
            <a href={site.email ? `mailto:${site.email}` : "#"} className="hover:text-ink">
              Email
            </a>
          </li>
          <li>
            {/* TODO: set site.linkedinUrl in lib/site.ts */}
            <a href={site.linkedinUrl || "#"} className="hover:text-ink">
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
