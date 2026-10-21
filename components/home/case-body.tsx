import type { ComponentType } from "react";
import type { CaseMeta } from "@/lib/cases";
import { MoreWork, type MoreWorkItem } from "@/components/more-work";

// Full-width case story shared with the direct project page.
export function CaseBody({
  meta,
  Content,
  others,
}: {
  meta: CaseMeta;
  Content: ComponentType;
  others: MoreWorkItem[];
}) {
  return (
    <article className="case-study" data-project={meta.short === "Devsign" ? "devsign" : "gemini"}>
      <div className="case-content">
        <p className="case-draft-note">Working draft · Content and visuals in progress</p>
        <Content />
      </div>
      <MoreWork items={others} />
    </article>
  );
}
