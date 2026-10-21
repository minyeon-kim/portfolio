import type { ComponentType } from "react";
import type { CaseMeta } from "@/lib/cases";
import { NextCaseButton } from "./case-panels";

// Full-width case story shared with the direct project page.
export function CaseBody({
  meta,
  Content,
  next,
}: {
  meta: CaseMeta;
  Content: ComponentType;
  next?: { index: number; slug: string; name: string; description?: string };
}) {
  return (
    <article className="case-study" data-project={meta.short === "Devsign" ? "devsign" : "gemini"}>
      <div className="case-content">
        <Content />
      </div>
      {next && (
        <nav aria-label="Next case" className="next-project-nav">
          <NextCaseButton index={next.index} slug={next.slug} name={next.name} description={next.description} />
        </nav>
      )}
    </article>
  );
}
