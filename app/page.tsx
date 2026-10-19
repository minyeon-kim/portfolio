import Link from "next/link";
import { ConceptLabel } from "@/components/case-label";
import { getCases } from "@/lib/cases";
import { site } from "@/lib/site";

export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured).slice(0, 2);

  return (
    <div className="mx-auto max-w-page px-2 md:px-4">
      <section className="pt-8 pb-6 md:pt-12">
        <p className="mb-2 font-mono text-xs text-muted">{site.name}</p>
        {/* TODO: "Decrypted" scramble on load (hero task). 64px is hero-only. */}
        <h1 className="max-w-[16ch] text-xl font-medium tracking-tight md:text-display">
          {site.positioning}
        </h1>
      </section>

      <section id="work" aria-labelledby="work-heading" className="scroll-mt-4 pb-8">
        <h2 id="work-heading" className="mb-2 font-mono text-xs text-muted">
          Selected work
        </h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {featured.map(({ slug, meta }) => (
            <li key={slug}>
              <Link
                href={`/work/${slug}/`}
                className="block h-full rounded-md border border-line bg-surface p-3 transition-colors duration-150 ease-standard hover:border-accent"
              >
                <div className="mb-1 flex items-center gap-1 font-mono text-xs text-muted">
                  {meta.year && <span>{meta.year}</span>}
                  {meta.concept && <ConceptLabel />}
                </div>
                <h3 className="mb-1 text-lg font-medium">{meta.title}</h3>
                <p className="text-sm text-muted">{meta.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
