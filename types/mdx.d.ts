declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { CaseMeta } from "@/lib/cases";

  export const meta: CaseMeta;
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
