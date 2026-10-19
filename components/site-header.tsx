import Link from "next/link";
import { nav, site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="z-20 border-b border-line bg-bg/90 backdrop-blur-sm md:sticky md:top-0">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2 py-2 md:px-4">
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
    </header>
  );
}
