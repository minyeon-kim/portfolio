import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { Todo } from "@/components/todo";
import Story, { skills } from "@/content/about.mdx";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

const columns = [
  { title: "Design", items: skills.design },
  { title: "Engineering", items: skills.engineering },
  { title: "Security", items: skills.security },
];

export default function AboutPage() {
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));

  return (
    <div className="mx-auto max-w-prose px-2 pt-8 pb-12">
      <header className="mb-6">
        <p className="mb-1 font-mono text-xs text-muted">{site.name}</p>
        <h1 className="text-xl font-medium tracking-tight">About</h1>
        <p className="mt-2 text-base text-muted">{site.positioning}</p>
      </header>

      <section aria-labelledby="story-heading" className="mb-8">
        <h2 id="story-heading" className="font-mono text-xs text-muted">
          From security to design
        </h2>
        <Story />
      </section>

      <section aria-labelledby="skills-heading" className="mb-8">
        <h2 id="skills-heading" className="reveal mb-2 font-mono text-xs text-muted">
          Skills
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title} className="reveal rounded-md border border-line bg-surface p-2">
              <h3 className="mb-1 text-base font-medium">{col.title}</h3>
              <ul className="space-y-0.5 text-sm text-muted">
                {col.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-heading" className="reveal border-t border-line pt-4">
        <h2 id="contact-heading" className="mb-2 font-mono text-xs text-muted">
          Contact
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {hasResume ? (
            <a
              href={site.resumeUrl}
              className="inline-flex h-4 items-center rounded-md border border-line bg-surface px-1.5 font-mono text-xs hover:border-ink"
            >
              Resume (PDF)
            </a>
          ) : (
            <Todo>add public/resume.pdf; the link appears once it exists</Todo>
          )}
          {site.email ? (
            <div className="flex items-center gap-1">
              <a href={`mailto:${site.email}`} className="text-sm text-accent underline underline-offset-4">
                {site.email}
              </a>
              <CopyButton value={site.email} label="Copy email" />
            </div>
          ) : (
            <Todo>set site.email in lib/site.ts; the copy button appears once it&apos;s set</Todo>
          )}
        </div>
      </section>
    </div>
  );
}
