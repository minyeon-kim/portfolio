import { CaseBody } from "@/components/home/case-body";
import { CasePanels } from "@/components/home/case-panels";
import { ProjectStage } from "@/components/home/project-stage";
import { SideRail } from "@/components/home/side-rail";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { getCase, getCases } from "@/lib/cases";
import { nav, site } from "@/lib/site";

// The landing page: a full-screen stage for the selected case, then that
// case's content, so picking a case and scrolling reads straight into it.
export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured);
  const bodies = await Promise.all(featured.map((c) => getCase(c.slug)));

  return (
    <>
      <SideRail projects={featured.map(({ slug, meta }) => ({ slug, name: meta.short ?? meta.title }))} pages={nav} />
      <ProjectStage
        projects={featured.map(({ slug, meta, tldr }) => ({
          slug,
          name: meta.short ?? meta.title,
          title: meta.title,
          problem: tldr.problem,
          role: meta.role,
          timeline: meta.timeline,
          tools: meta.tools?.join(", "),
          cover: meta.cover,
          concept: meta.concept,
        }))}
        intro={
          <ScrambleHeadline
              text={site.positioning}
              className="text-xl font-medium tracking-tight md:text-lg"
            />
        }
      />
      {/* Blend from the dark stage into the page, so there is no edge in light theme. */}
      <div
        aria-hidden="true"
        className="full-bleed hidden h-16 bg-[linear-gradient(to_bottom,var(--media-bg),var(--bg))] md:block"
      />
      <CasePanels>
        {bodies.map(({ slug, meta, Content }, i) => {
          const n = (i + 1) % bodies.length;
          return (
            <CaseBody
              key={slug}
              meta={meta}
              Content={Content}
              next={bodies.length > 1 ? { index: n, name: bodies[n].meta.short ?? bodies[n].meta.title } : undefined}
            />
          );
        })}
      </CasePanels>
    </>
  );
}
