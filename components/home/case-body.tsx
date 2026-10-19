import type { ComponentType } from "react";
import type { CaseMeta } from "@/lib/cases";
import { NextCaseButton } from "./case-panels";

// A case's content as it appears under the landing stage: the meta row, then
// the MDX body (TL;DR, Context, ..., Outcome). The stage above is its title.
export function CaseBody({
  meta,
  Content,
  next,
}: {
  meta: CaseMeta;
  Content: ComponentType;
  next?: { index: number; name: string };
}) {
  const metaRow = [
    { label: "Role", value: meta.role },
    { label: "Timeline", value: meta.timeline },
    { label: "Tools", value: meta.tools?.join(", ") },
  ].filter((item) => item.value);

  return (
    <article className="mx-auto max-w-prose px-2 pt-8 pb-16">
      {metaRow.length > 0 && (
        <dl className="mb-6 grid gap-2 font-mono text-xs sm:grid-cols-3">
          {metaRow.map(({ label, value }) => (
            <div key={label} className="reveal">
              <dt className="mb-0.5 text-muted uppercase">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Content />
      {next && (
        <div className="mt-12">
          <NextCaseButton index={next.index} name={next.name} />
        </div>
      )}
    </article>
  );
}
