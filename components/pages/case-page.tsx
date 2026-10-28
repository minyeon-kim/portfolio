import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseBody } from "@/components/home/case-body";
import { DevsignHero } from "@/components/devsign-hero";
import { ProjectHero } from "@/components/project-hero";
import { getCase, getCaseSlugs, getOtherCases } from "@/lib/cases";
import type { Locale } from "@/lib/i18n";

// A case study page; /work/[slug] and /ko/work/[slug] both render it.
export function caseParams(locale: Locale = "en") {
  return getCaseSlugs(locale).map((slug) => ({ slug }));
}

export async function caseMetadata(slug: string, locale: Locale): Promise<Metadata> {
  if (!getCaseSlugs(locale).includes(slug)) return {};
  const { meta, tldr } = await getCase(slug, locale);
  return { title: meta.title, description: tldr.problem };
}

export async function CasePage({ slug, locale = "en" }: { slug: string; locale?: Locale }) {
  if (!getCaseSlugs(locale).includes(slug)) notFound();
  const { meta, Content } = await getCase(slug, locale);
  const others = await getOtherCases(slug, locale);

  return (
    <div className="project-detail" data-case-slug={slug}>
      {meta.hero ? (
        <header className="project-hero devsign-hero-page">
          <DevsignHero hero={meta.hero} name={meta.short ?? meta.title} project={slug} alt={slug === "gemini-privacy" ? `${meta.short ?? meta.title}: the Source badge opens a sheet where Gmail is switched off, and the line about Jeongmin leaves the answer` : `${meta.short ?? meta.title}: a drifted Place order button is flagged, the review panel opens, and the designer approves the fix`} />
        </header>
      ) : <ProjectHero locale={locale} gemini={slug === "gemini-privacy"} canvas={slug === "workflow-app"} name={meta.short ?? meta.title} role={meta.role} timeline={meta.timeline} cover={meta.cover} concept={meta.concept} keywords={meta.keywords} />}
      <div id="case-body">
        <CaseBody meta={meta} Content={Content} others={others.map((c) => ({ slug: c.slug, name: c.meta.short ?? c.meta.title, description: c.tldr.problem, cover: c.meta.cover }))} />
      </div>
    </div>
  );
}
