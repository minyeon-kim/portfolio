import { CaseBody } from "@/components/home/case-body";
import { CasePanels } from "@/components/home/case-panels";
import { ProjectStage } from "@/components/home/project-stage";
import { getCase, getCases } from "@/lib/cases";
import type { Locale } from "@/lib/i18n";
import * as aboutEn from "@/content/about.mdx";
import * as aboutKo from "@/content/ko/about.mdx";

// The landing page: an intro (name + positioning, pick a case), then, once a
// case is picked, its stage and its content, so scrolling reads into it.
export async function HomePage({ locale = "en" }: { locale?: Locale }) {
  const featured = (await getCases(locale)).filter((c) => c.meta.featured);
  const bodies = await Promise.all(featured.map((c) => getCase(c.slug, locale)));
  // The About world on the landing: the headline (its emphasis set apart) as
  // the statement, the first bio sentence as the paragraph.
  const about = locale === "ko" ? aboutKo : aboutEn;

  return (
    <>
      <ProjectStage
        projects={featured.map(({ slug, meta, tldr }) => ({
          slug,
          name: meta.short ?? meta.title,
          title: meta.title,
          caption: meta.caption,
          problem: tldr.problem,
          role: meta.role,
          timeline: meta.timeline,
          cover: meta.cover,
          concept: meta.concept,
          hero: meta.hero,
        }))}
        about={{ headline: about.headline.join(" "), emphasis: about.headlineEmphasis, bio: about.bio[0] }}
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
