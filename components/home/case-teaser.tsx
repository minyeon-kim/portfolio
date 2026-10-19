import dynamic from "next/dynamic";
import type { CaseTeaser as Teaser } from "@/lib/cases";

// Demos load as separate chunks so the landing page's first paint stays light.
const BeforeAfter = dynamic(() => import("@/components/mdx/before-after").then((m) => m.BeforeAfter));
const TokenPlayground = dynamic(() =>
  import("@/components/mdx/token-playground").then((m) => m.TokenPlayground),
);

export function CaseTeaser({ teaser }: { teaser: Teaser }) {
  if (teaser.type === "before-after") {
    return (
      <BeforeAfter
        before={teaser.before}
        after={teaser.after}
        width={teaser.width}
        height={teaser.height}
        caption={teaser.caption}
      />
    );
  }
  return <TokenPlayground wide={false} />;
}
