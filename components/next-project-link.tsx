"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";

export function NextProjectLink({ slug, name, description }: { slug: string; name: string; description?: string }) {
  const router = useRouter();
  const href = `/work/${slug}/`;
  return (
    <Link href={href} className="group block rounded-md" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      revealNextProject(() => router.push(href, { scroll: false }), () => Boolean(document.querySelector(`[data-case-slug="${slug}"]`)));
    }}>
      <span className="mb-1 block font-mono text-xs text-muted">Next project</span>
      <span className="flex items-baseline gap-1 text-lg font-medium">{name}<span aria-hidden="true" className="transition-transform duration-250 ease-standard group-hover:translate-y-0.5">↓</span></span>
      {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
    </Link>
  );
}
