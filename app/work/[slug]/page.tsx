import type { Metadata } from "next";
import { MoreWork } from "@/components/more-work";
import { notFound } from "next/navigation";
import { ProjectHero } from "@/components/project-hero";
import { getCase, getCaseSlugs, getOtherCases } from "@/lib/cases";

export function generateStaticParams() {
  return getCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) return {};
  const { meta, tldr } = await getCase(slug);
  return { title: meta.title, description: tldr.problem };
}

export default async function CasePage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) notFound();
  const { meta, Content } = await getCase(slug);
  const others = await getOtherCases(slug);

  return (
    <div className="project-detail" data-case-slug={slug}>
      <ProjectHero gemini={slug === "gemini-privacy"} canvas={slug === "workflow-app"} name={meta.short ?? meta.title} role={meta.role} timeline={meta.timeline} cover={meta.cover} concept={meta.concept} />
      <article id="case-body" className="case-study" data-project={slug === "workflow-app" ? "devsign" : "gemini"}>
        <div className="case-content">
        <Content />

        </div>
        <MoreWork items={others.map((c) => ({ slug: c.slug, name: c.meta.short ?? c.meta.title, description: c.tldr.problem }))} />
      </article>
    </div>
  );
}
