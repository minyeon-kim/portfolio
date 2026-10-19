import Link from "next/link";
import { nav, site } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <HeaderShell>
      {/* Folds into a compact floating bar after a little scroll (md+). */}
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-transparent px-2 py-2 transition-[max-width,margin,padding,background-color,border-color] duration-400 ease-standard md:px-4 md:group-data-compact/header:my-1 md:group-data-compact/header:max-w-[760px] md:group-data-compact/header:rounded-md md:group-data-compact/header:border-line md:group-data-compact/header:bg-surface/90 md:group-data-compact/header:py-1 md:group-data-compact/header:backdrop-blur-sm">
        <Link href="/" className="text-sm font-medium">
          {site.name}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-3">
          <ul className="flex items-center gap-2 font-mono sm:gap-3 text-xs">
            {nav.map((item) => (
              <li key={item.href}>
                {/* TODO: "Decrypted" scramble on hover (separate task). */}
                <Link
                  href={item.href}
                  className="text-muted transition-colors duration-150 ease-standard hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.resumeUrl}
                className="text-accent underline-offset-4 hover:underline"
              >
                Resume
              </a>
            </li>
          </ul>
          <ThemeToggle />
        </nav>
      </div>
    </HeaderShell>
  );
}
