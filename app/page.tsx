import Link from "next/link";
import { ConceptLabel } from "@/components/case-label";
import { CopyButton } from "@/components/copy-button";
import { CaseSection } from "@/components/home/case-section";
import { ExperimentGrid } from "@/components/playground/experiments";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { SectionRail } from "@/components/section-rail";
import { Todo } from "@/components/todo";
import { getCases } from "@/lib/cases";
import { site } from "@/lib/site";

// The landing page is one long scroll: hero with an index of the featured
// cases (visible without scrolling), then a section per case, the
// playground, a short about, and contact.
export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured).slice(0, 2);

  const rail = [
    { id: "intro", label: "Intro" },
    ...featured.map((c) => ({ id: `case-${c.slug}`, label: c.meta.short ?? c.meta.title })),
    { id: "playground", label: "Playground" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="mx-auto max-w-page px-2 md:px-4">
      <SectionRail items={rail} />

      <section id="intro" aria-label="Introduction" className="hero-exit pt-6 pb-6 md:pt-8">
        <p className="mb-2 font-mono text-xs text-muted">{site.name}</p>
        <ScrambleHeadline
          text={site.positioning}
          className="text-xl font-medium tracking-tight md:text-display md:tracking-[-0.02em]"
        />
      </section>

      {/* Index of the featured cases; each row glides down to its section. */}
      <nav id="work" aria-label="Selected work" className="pb-8">
        <p className="mb-1 font-mono text-xs text-muted">Selected work</p>
        <ol className="border-t border-line">
          {featured.map(({ slug, meta, tldr }, i) => (
            <li key={slug}>
              <a
                href={`#case-${slug}`}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-0.5 border-b border-line py-2 transition-colors duration-150 ease-standard hover:bg-surface md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]"
                // Phone: number, name, arrow on one line, summary below. md+: one row.
              >
                <span className="col-start-1 row-start-1 pl-0.5 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="col-start-2 row-start-1 flex flex-wrap items-baseline gap-1 text-lg font-medium">
                  {meta.short ?? meta.title}
                  {meta.concept && <ConceptLabel />}
                </span>
                <span className="col-span-2 col-start-2 row-start-2 text-sm text-muted md:col-span-1 md:col-start-3 md:row-start-1">{tldr.problem}</span>
                <span
                  aria-hidden="true"
                  className="col-start-3 row-start-1 pr-1 text-muted transition-[translate,color] duration-250 ease-standard group-hover:translate-y-0.5 group-hover:text-accent md:col-start-4"
                >
                  ↓
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {featured.map((entry, i) => (
        <CaseSection key={entry.slug} entry={entry} index={i} total={featured.length} />
      ))}

      <section id="playground" aria-labelledby="playground-title" className="border-t border-line py-12">
        <div className="reveal mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="mb-1 font-mono text-xs text-muted">Playground</p>
            <h2 id="playground-title" className="text-xl font-medium tracking-tight">
              Small experiments, all working
            </h2>
          </div>
          <Link href="/playground/" className="font-mono text-xs text-accent underline-offset-4 hover:underline">
            Open the playground →
          </Link>
        </div>
        <ExperimentGrid headingLevel="h3" />
      </section>

      <section id="about" aria-labelledby="about-title" className="border-t border-line py-12">
        <p className="reveal mb-1 font-mono text-xs text-muted">About</p>
        <h2 id="about-title" className="reveal mb-6 max-w-[20ch] text-xl font-medium tracking-tight">
          From security engineering to product design
        </h2>
        {/* The three stages come from claude.md; the story itself lives on /about. */}
        <ol className="mb-6 grid gap-2 md:grid-cols-3">
          {["Computer science", "IT security", "Product design"].map((stage, i) => (
            <li key={stage} className="reveal border-t-2 border-line pt-2 [&:last-child]:border-accent">
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-lg font-medium">{stage}</p>
            </li>
          ))}
        </ol>
        <Link href="/about/" className="reveal inline-block font-mono text-xs text-accent underline-offset-4 hover:underline">
          Read the story →
        </Link>
      </section>

      <section id="contact" aria-labelledby="contact-title" className="border-t border-line py-12">
        <p className="reveal mb-1 font-mono text-xs text-muted">Contact</p>
        <h2 id="contact-title" className="reveal mb-4 text-xl font-medium tracking-tight">
          Building something for privacy, trust, or developers? Let&apos;s talk.
        </h2>
        <div className="reveal flex flex-wrap items-center gap-2">
          {site.email ? (
            <>
              <a href={`mailto:${site.email}`} className="text-base text-accent underline underline-offset-4">
                {site.email}
              </a>
              <CopyButton value={site.email} label="Copy email" />
            </>
          ) : (
            <Todo>set site.email in lib/site.ts to show the email and copy button</Todo>
          )}
          {site.linkedinUrl ? (
            <a href={site.linkedinUrl} className="font-mono text-xs text-muted hover:text-ink">
              LinkedIn
            </a>
          ) : (
            <Todo>set site.linkedinUrl in lib/site.ts</Todo>
          )}
        </div>
      </section>
    </div>
  );
}
