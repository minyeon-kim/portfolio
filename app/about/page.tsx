import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { CaseMedia, CaseMediaPair, CaseSection, CaseStatement } from "@/components/case-story";
import { ProjectHero } from "@/components/project-hero";
import { Todo } from "@/components/todo";
import Story, { bio, headline, principles, skills } from "@/content/about.mdx";
import { getCases } from "@/lib/cases";
import { site, withBase } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: site.positioning,
};

const columns = [
  { title: "Research", items: skills.research },
  { title: "Design & build", items: skills.build },
  { title: "Background", items: skills.background },
];

// Same frame as a project page: editorial opener, a portrait beside a short bio,
// then numbered sections. Photo spots are labelled placeholders until real
// photos exist.
export default async function AboutPage() {
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
  // Labelled photo placeholders until the real photos are in /public/images/about/.
  const portrait = "/images/about/portrait.webp";
  const hasPortrait = fs.existsSync(path.join(process.cwd(), "public", portrait));
  const work = (await getCases()).filter((c) => c.meta.featured);

  return (
    <div data-about-page className="project-detail">
      <ProjectHero
        name="About"
        details={[
          { label: "Role", value: "Product designer" },
          { label: "Background", value: "Security consultant, 4 years" },
          { label: "Focus", value: "End to end, research to working prototype" },
        ]}
      />
      <article className="case-study" data-project="about">
        <div className="case-content">
          <CaseStatement><p>{headline}</p></CaseStatement>

          <div className="about-intro" data-portrait>
            {hasPortrait
              ? <CaseMedia variant="portrait" src={portrait} width={1200} height={1500} label="Portrait of Minyeon" />
              : <CaseMedia variant="portrait" label="Portrait of Minyeon" />}
            <div className="about-bio">
              {bio.map((paragraph) => <p key={paragraph} className="reveal">{paragraph}</p>)}
              <Todo>add where you are based and whether you are open to relocation or remote roles</Todo>
            </div>
          </div>

          <CaseSection id="approach" label="01 / What I bring" title="What I bring to a team">
            <ol className="about-rows">
              {principles.map((item, i) => (
                <li key={item.title} className="reveal">
                  <span className="about-rows-index">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="about-rows-title">{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CaseSection>

          <CaseSection id="work" label="02 / Selected work" title="Recent projects">
            <ul className="about-rows">
              {work.map(({ slug, meta, tldr }) => (
                <li key={slug} className="reveal">
                  <span className="about-rows-index">{meta.timeline}</span>
                  <div>
                    <h3 className="about-rows-title">
                      <Link href={`/work/${slug}/`} className="link">{meta.short ?? meta.title}</Link>
                    </h3>
                    <p>{tldr.problem}</p>
                    {meta.role && <p className="about-rows-meta">{meta.concept ? "Concept · " : ""}{meta.role}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </CaseSection>

          <CaseSection id="background" label="03 / Experience" title="From cybersecurity to design">
            <Story />
          </CaseSection>

          <CaseSection id="toolkit" label="04 / Toolkit" title="What I work with">
            <div className="about-skills">
              {columns.map((col) => (
                <div key={col.title} className="reveal">
                  <h3 className="about-skills-title">{col.title}</h3>
                  <ul>
                    {col.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CaseSection>


          <CaseSection id="outside" label="05 / Outside work" title="Off the screen">
            <Todo>a line or two about what you do outside work, in your own words</Todo>
          </CaseSection>
          {/* TODO: replace with real photos (public/images/about/), e.g. at work and a workshop or talk. */}
          <CaseMediaPair>
            <CaseMedia variant="screen" label="Photo of Minyeon at work" />
            <CaseMedia variant="screen" label="Workshop, study group or talk" />
          </CaseMediaPair>

          <CaseSection id="contact" label="06 / Contact" title="Get in touch">
            <p className="reveal">Open to product designer and design engineer roles, especially in privacy, security and developer tools.</p>
            <div className="flex flex-wrap items-center gap-2">
              {hasResume ? (
                <a
                  href={withBase(site.resumeUrl)}
                  className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong"
                >
                  Resume (PDF)
                </a>
              ) : (
                <Todo>add public/resume.pdf; the link appears once it exists</Todo>
              )}
              {site.linkedinUrl ? (
                <a href={site.linkedinUrl} className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong">
                  LinkedIn
                </a>
              ) : (
                <Todo>set site.linkedinUrl in lib/site.ts</Todo>
              )}
              {site.email ? (
                <div className="flex items-center gap-1">
                  <a href={`mailto:${site.email}`} className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong">
                    Email
                  </a>
                  <CopyButton value={site.email} label="Copy email" />
                </div>
              ) : (
                <Todo>set site.email in lib/site.ts; the copy button appears once it&apos;s set</Todo>
              )}
            </div>
          </CaseSection>
        </div>
      </article>
    </div>
  );
}
