import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { CaseSection, CaseStatement } from "@/components/case-story";
import { ProjectHero } from "@/components/project-hero";
import { Todo } from "@/components/todo";
import Story, { skills } from "@/content/about.mdx";
import { site, withBase } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

const columns = [
  { title: "Design", items: skills.design },
  { title: "Engineering", items: skills.engineering },
  { title: "Security", items: skills.security },
];

// Same frame as a project page: editorial opener, then numbered story sections.
export default function AboutPage() {
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <div data-about-page className="project-detail">
      <ProjectHero
        name="About"
        details={[
          { label: "Role", value: "Product designer" },
          { label: "Background", value: "Computer science, IT security" },
          { label: "Focus", value: "Research, design, engineering" },
        ]}
      />
      <article className="case-study" data-project="about">
        <div className="case-content">
          <CaseStatement><p>{site.positioning}</p></CaseStatement>

          <CaseSection id="story" label="01 / Story" title="From security to design">
            <Story />
          </CaseSection>

          <CaseSection id="skills" label="02 / Skills" title="What I work with">
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

          <CaseSection id="contact" label="03 / Contact" title="Get in touch">
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
              {site.email ? (
                <div className="flex items-center gap-1">
                  <a href={`mailto:${site.email}`} className="link text-sm text-accent">
                    {site.email}
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
