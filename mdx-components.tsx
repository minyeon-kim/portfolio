import { Children, isValidElement, type ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import dynamic from "next/dynamic";
import { BeforeAfter } from "@/components/mdx/before-after";
import { Callout } from "@/components/mdx/callout";
import { Chapter, Story } from "@/components/mdx/story";
import { TLDR } from "@/components/mdx/tldr";
import { WhyIChose } from "@/components/mdx/why-i-chose";
import { Todo } from "@/components/todo";
import { slugify } from "@/lib/slug";

// Demos are split into their own chunks so case pages without them stay light.
const TokenPlayground = dynamic(() =>
  import("@/components/mdx/token-playground").then((m) => m.TokenPlayground),
);

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");
}

// Case study body styles. Body column is 680px (max-w-prose).
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 id={slugify(textOf(children))} className="reveal mt-8 mb-2 scroll-mt-4 text-lg font-medium md:scroll-mt-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(textOf(children))} className="mt-4 mb-1 scroll-mt-4 text-base font-medium md:scroll-mt-1">
      {children}
    </h3>
  ),
  p: (props) => <p className="mb-2 text-base text-ink" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-3 text-base" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-3 text-base" {...props} />,
  li: (props) => <li className="mb-0.5" {...props} />,
  a: (props) => <a className="text-accent underline underline-offset-4" {...props} />,
  strong: (props) => <strong className="font-medium" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-3 border-l-2 border-line pl-2 text-base text-muted [&_p]:text-muted" {...props} />
  ),
  code: (props) => <code className="font-mono text-xs" {...props} />,
  TLDR,
  WhyIChose,
  BeforeAfter,
  Callout,
  TokenPlayground,
  Story,
  Chapter,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
