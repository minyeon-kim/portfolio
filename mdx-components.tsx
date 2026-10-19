import type { MDXComponents } from "mdx/types";

// Case study body styles. Body column is 680px (max-w-prose).
const components: MDXComponents = {
  h2: (props) => <h2 className="mt-6 mb-2 text-lg font-medium" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-1 text-base font-medium" {...props} />,
  p: (props) => <p className="mb-2 text-base text-ink" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-3 text-base" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-3 text-base" {...props} />,
  li: (props) => <li className="mb-0.5" {...props} />,
  a: (props) => (
    <a className="text-accent underline underline-offset-4" {...props} />
  ),
  strong: (props) => <strong className="font-medium" {...props} />,
  code: (props) => <code className="font-mono text-xs" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
