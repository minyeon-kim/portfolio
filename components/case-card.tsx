import Image from "next/image";
import Link from "next/link";
import type { CaseEntry } from "@/lib/cases";
import { ConceptLabel } from "./case-label";

const isDev = process.env.NODE_ENV === "development";

export function CaseCard({ slug, meta, tldr }: CaseEntry) {
  return (
    <Link href={`/work/${slug}/`} className="group block rounded-md">
      <div className="aspect-[2/1] overflow-hidden rounded-md border border-line bg-surface">
        <div className="size-full transition-transform duration-400 ease-standard group-hover:scale-[1.02] group-focus-visible:scale-[1.02]">
          {meta.cover ? (
            <Image
              src={meta.cover}
              alt=""
              width={1600}
              height={800}
              sizes="(min-width: 768px) 568px, 100vw"
              priority
              className="size-full object-cover"
            />
          ) : (
            // TODO: add meta.cover (1600x800 WebP) in the case file.
            isDev && (
              <div className="flex size-full items-center justify-center font-mono text-xs text-muted">
                TODO: cover image
              </div>
            )
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 font-mono text-xs text-muted">
        {meta.concept && <ConceptLabel />}
        {tldr.role && <span>{tldr.role}</span>}
      </div>
      <h3 className="mt-0.5 flex items-baseline gap-1 text-lg font-medium">
        {meta.title}
        <span
          aria-hidden="true"
          className="transition-transform duration-250 ease-standard group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
        >
          →
        </span>
      </h3>
      {tldr.problem && <p className="mt-0.5 text-sm text-muted">{tldr.problem}</p>}
    </Link>
  );
}

// Dev-only stand-in so the two-column layout is visible before two cases exist.
export function CaseCardSlot() {
  if (!isDev) return null;
  return (
    <div className="flex aspect-[2/1] items-center justify-center rounded-md border border-dashed border-line px-2 text-center font-mono text-xs text-muted">
      TODO: mark a second case as featured: true
    </div>
  );
}
