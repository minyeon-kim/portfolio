"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { NextProjectContent } from "./next-project-content";

export function NextProjectLink({ slug, name, description }: { slug: string; name: string; description?: string }) {
  const router = useRouter();
  const href = `/work/${slug}/`;
  return (
    <Link href={href} className="next-project" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      revealNextProject(() => router.push(href, { scroll: false }), () => Boolean(document.querySelector(`[data-case-slug="${slug}"]`)));
    }}>
      <NextProjectContent slug={slug} name={name} description={description} />
    </Link>
  );
}
