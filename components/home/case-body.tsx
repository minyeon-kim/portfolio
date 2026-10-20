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
  next?: { index: number; name: string };
}) {
  return (
    <article className="case-study" data-project={meta.short === "Devsign" ? "devsign" : "gemini"}>
      <div className="case-content">
        <Content />
      </div>
      {next && (
        <div className="mt-12">
          <NextCaseButton index={next.index} name={next.name} />
        </div>
      )}
    </article>
  );
}
