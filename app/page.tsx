import { CaseCard, CaseCardSlot } from "@/components/case-card";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { getCases } from "@/lib/cases";
import { site } from "@/lib/site";

export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured).slice(0, 2);

  return (
    <div className="mx-auto max-w-page px-2 md:px-4">
      <section aria-label="Introduction" className="hero-exit pt-6 pb-5 md:pt-8 md:pb-6">
        <p className="mb-2 font-mono text-xs text-muted">{site.name}</p>
        <ScrambleHeadline
          text={site.positioning}
          className="text-xl font-medium tracking-tight md:text-display md:tracking-[-0.02em]"
        />
      </section>

      <section id="work" aria-labelledby="work-heading" className="scroll-mt-4 pb-8">
        <h2 id="work-heading" className="sr-only">
          Selected work
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 md:gap-2">
          {featured.map((entry) => (
            <li key={entry.slug} className="reveal">
              <CaseCard {...entry} />
            </li>
          ))}
          {featured.length < 2 && (
            <li aria-hidden="true">
              <CaseCardSlot />
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
