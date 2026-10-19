import Link from "next/link";
import { CaseCover } from "@/components/case-cover";
import { ConceptLabel } from "@/components/case-label";
import { FillText } from "@/components/fill-text";
import type { CaseEntry } from "@/lib/cases";
import { CaseSteps } from "./case-steps";
import { CaseTeaser } from "./case-teaser";

// One case on the landing page: a sticky summary column on the left and the
// story (problem, key decisions, live demo) scrolling past on the right.
export function CaseSection({
  entry,
  index,
  total,
  cover = true,
}: {
  entry: CaseEntry;
  index: number;
  total: number;
  // "mobile": only below lg, where the work selector's preview is hidden.
  cover?: boolean | "mobile";
}) {
  const { slug, meta, tldr, decisions } = entry;
  const href = `/work/${slug}/`;
  const id = (part: string) => `${slug}-${part}`;
  const steps = [
    { id: id("problem"), label: "Problem" },
    ...(decisions.length ? [{ id: id("decisions"), label: "Key decisions" }] : []),
    ...(meta.teaser ? [{ id: id("demo"), label: "Try it" }] : []),
  ];
  const label = "mb-1 font-mono text-xs text-muted";

  return (
    <section id={`case-${slug}`} aria-labelledby={`case-${slug}-title`} className="border-t border-line pb-12">
      {cover && meta.cover && (
        <div className={cover === "mobile" ? "lg:hidden" : undefined}>
          <CaseCover src={meta.cover} />
        </div>
      )}
      <div className="pt-12 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <div className="mb-6 lg:sticky lg:top-12 lg:mb-0 lg:self-start">
          <p className="reveal mb-2 flex items-center gap-1 font-mono text-xs text-muted">
            <span>
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            {meta.concept && <ConceptLabel />}
          </p>
          <h2 id={`case-${slug}-title`} className="reveal mb-2 text-xl font-medium tracking-tight">
            {meta.title}
          </h2>
          <p className="reveal mb-4 font-mono text-xs text-muted">
            {[meta.role, meta.timeline].filter(Boolean).join(" · ")}
          </p>
          <div className="reveal mb-4 hidden lg:block">
            <CaseSteps steps={steps} />
          </div>
          <Link
            href={href}
            className="reveal group press inline-flex h-4 items-center gap-1 rounded-md border border-line bg-surface px-1.5 text-sm transition-colors duration-150 ease-standard hover:border-accent"
          >
            Read the full case
            <span aria-hidden="true" className="transition-transform duration-250 ease-standard group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <div className="space-y-12">
          <div id={id("problem")} className="scroll-mt-4 md:scroll-mt-1">
            <p className={`reveal ${label}`}>Problem</p>
            <FillText text={tldr.problem} className="mb-4 text-xl font-medium tracking-tight" />
            {tldr.outcome && (
              <>
                <p className={`reveal ${label}`}>Outcome</p>
                <p className="reveal text-base text-muted">{tldr.outcome}</p>
              </>
            )}
          </div>

          {decisions.length > 0 && (
            <div id={id("decisions")} className="scroll-mt-4 md:scroll-mt-1">
              <p className={`reveal ${label}`}>Key decisions</p>
              <ol className="border-t border-line">
                {decisions.map((d, k) => (
                  <li key={d.id} className="reveal">
                    <Link
                      href={`${href}#${d.id}`}
                      className="group flex items-baseline gap-2 border-b border-line py-2 transition-colors duration-150 ease-standard hover:bg-surface"
                    >
                      <span className="font-mono text-xs text-muted">{String(k + 1).padStart(2, "0")}</span>
                      <span className="flex-1 text-base">{d.label}</span>
                      <span
                        aria-hidden="true"
                        className="pr-1 text-muted transition-[translate,color] duration-250 ease-standard group-hover:translate-x-0.5 group-hover:text-accent"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {meta.teaser && (
            <div id={id("demo")} className="scroll-mt-4 md:scroll-mt-1">
              <p className={`reveal ${label}`}>Try it</p>
              <CaseTeaser teaser={meta.teaser} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
