import { CaseBody } from "@/components/home/case-body";
import { CasePanels } from "@/components/home/case-panels";
import { ProjectStage } from "@/components/home/project-stage";
import { AlignWords } from "@/components/home/align-words";
import { SideRail } from "@/components/home/side-rail";
import { getCase, getCases } from "@/lib/cases";
import { ui, type Locale } from "@/lib/i18n";

// The landing page: an intro (name + positioning, pick a case), then, once a
// case is picked, its stage and its content, so scrolling reads into it.
export async function HomePage({ locale = "en" }: { locale?: Locale }) {
  const featured = (await getCases(locale)).filter((c) => c.meta.featured);
  const bodies = await Promise.all(featured.map((c) => getCase(c.slug, locale)));

  return (
    <>
      <SideRail projects={featured.map(({ slug, meta }) => ({ slug, name: meta.short ?? meta.title }))} />
      <ProjectStage
        projects={featured.map(({ slug, meta, tldr }) => ({
          slug,
          name: meta.short ?? meta.title,
          title: meta.title,
          problem: tldr.problem,
          role: meta.role,
          timeline: meta.timeline,
          cover: meta.cover,
          concept: meta.concept,
          hero: meta.hero,
        }))}
        intro={<h1 className="intro-headline"><AlignWords text={ui[locale].positioning} /></h1>}
      />
      <CasePanels>
        {bodies.map(({ slug, meta, Content }, i) => {
          const others = bodies.map((_, k) => (i + 1 + k) % bodies.length).slice(0, bodies.length - 1)
            .map((k) => ({ index: k, slug: bodies[k].slug, name: bodies[k].meta.short ?? bodies[k].meta.title, description: bodies[k].tldr.problem, cover: bodies[k].meta.cover }));
          return (
            <CaseBody
              key={slug}
              meta={meta}
              Content={Content}
              others={others}
            />
          );
        })}
      </CasePanels>
    </>
  );
}
