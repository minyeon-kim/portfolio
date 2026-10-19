import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { FillText } from "@/components/fill-text";
import { CaseSection } from "@/components/home/case-section";
import { TypeTrack } from "@/components/home/type-track";
import { WorkSelector } from "@/components/home/work-selector";
import { ExperimentGrid } from "@/components/playground/experiments";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { SectionRail } from "@/components/section-rail";
import { Todo } from "@/components/todo";
import { getCases } from "@/lib/cases";
import { site } from "@/lib/site";

// The landing page is one long scroll: hero, then the work selector (the
// featured cases, visible without scrolling) with the chosen case's section
// below it, then the playground, a short about, and contact.
export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured).slice(0, 2);

  const rail = [
    { id: "intro", label: "Intro" },
    { id: "work", label: "Work" },
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

      {/* Pick a project; only that project's section shows below it. */}
      <WorkSelector
        options={featured.map(({ slug, meta, tldr }) => ({
          slug,
          cover: meta.cover,
          name: meta.short ?? meta.title,
          problem: tldr.problem,
          role: meta.role,
          concept: meta.concept,
        }))}
      >
        {featured.map((entry, i) => (
          <CaseSection key={entry.slug} entry={entry} index={i} total={featured.length} cover="mobile" />
        ))}
      </WorkSelector>

      <TypeTrack />

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
        <FillText
          as="h2"
          id="about-title"
          text="From security engineering to product design"
          className="mb-6 max-w-[20ch] text-xl font-medium tracking-tight"
        />
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
        <FillText
          as="h2"
          id="contact-title"
          text="Building something for privacy, trust, or developers? Let's talk."
          className="mb-4 text-xl font-medium tracking-tight"
        />
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
