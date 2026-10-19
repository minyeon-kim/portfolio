declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { CaseMeta } from "@/lib/cases";

  export const meta: CaseMeta;
  // Only content/about.mdx exports this.
  export const skills: { design: string[]; engineering: string[]; security: string[] };
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
