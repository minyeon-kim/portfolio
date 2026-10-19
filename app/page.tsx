import { ProjectRail } from "@/components/home/project-rail";
import { ProjectStage } from "@/components/home/project-stage";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { getCases } from "@/lib/cases";
import { nav, site } from "@/lib/site";

// The landing page is one screen, Metalab-style: a short intro over the
// selected project's full-bleed cover, a floating list to pick the project,
// and that project's title. Case details, playground, about and contact live
// on their own pages (side nav and Menu).
export default async function Home() {
  const featured = (await getCases()).filter((c) => c.meta.featured);

  return (
    <>
      <ProjectRail projects={featured.map(({ slug, meta }) => ({ slug, name: meta.short ?? meta.title }))} pages={nav} />
      <ProjectStage
        projects={featured.map(({ slug, meta, tldr }) => ({
          slug,
          name: meta.short ?? meta.title,
          title: meta.title,
          problem: tldr.problem,
          role: meta.role,
          cover: meta.cover,
          concept: meta.concept,
        }))}
        intro={
          <ScrambleHeadline text={site.positioning} className="max-w-[24ch] text-xl font-light tracking-tight" />
        }
      />
    </>
  );
}
