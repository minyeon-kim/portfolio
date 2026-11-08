declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { CaseMeta } from "@/lib/cases";

  export const meta: CaseMeta;
  // Only content/about.mdx exports these.
  export const headline: string[];
  export const headlineEmphasis: string;
  export const hook: string;
  export const bio: string[];
  export const bridge: { statement: string; then: string; now: string; rows: { then: string; note?: string; title: string; body: string }[] };
  export const cards: { left: string; right: string };
  export const panels: { photo: string }[];
  export const experience: { label: string; title: string; body: string }[];
  export const skills: { research: string[]; build: string[]; background: string[] };
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
