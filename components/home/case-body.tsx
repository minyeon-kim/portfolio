import type { ComponentType } from "react";
import type { CaseMeta } from "@/lib/cases";
import { MoreWork, type MoreWorkItem } from "@/components/more-work";
import { SiteFooter } from "@/components/site-footer";
import { DevsignNav } from "@/components/devsign-nav";

// Gemini keeps its generic MDX sections; the Devsign body skin groups them into stages.
const GEMINI_NAV = [
  { id: "overview", label: "Overview" },
  { id: "discover", label: "Discover" },
  { id: "define", label: "Define" },
  { id: "develop", label: "Develop" },
  { id: "deliver", label: "Deliver" },
  { id: "review", label: "Takeaway" },
];

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
    <article className="case-study" data-project={meta.short === "Devsign" ? "devsign" : "gemini"} data-skin={meta.short !== "Devsign" && meta.hero ? "dv" : undefined}>
      <div className="case-content">
        {meta.short !== "Devsign" && meta.hero && <DevsignNav items={GEMINI_NAV} />}
        <Content />
      </div>
      <MoreWork items={others} />
      <SiteFooter />
    </article>
  );
}
