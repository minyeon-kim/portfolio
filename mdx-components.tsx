import { Children, isValidElement, type ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import dynamic from "next/dynamic";
import { BeforeAfter } from "@/components/mdx/before-after";
import { FillText } from "@/components/fill-text";
import { Callout } from "@/components/mdx/callout";
import { Chapter, Story } from "@/components/mdx/story";
import { TLDR } from "@/components/mdx/tldr";
import { WhyIChose } from "@/components/mdx/why-i-chose";
import { CaseSection, CaseMedia, CaseMediaPair, CaseStatement } from "@/components/case-story";
import { CaseGallery } from "@/components/case-gallery";
import { CaseCompare, CaseFindings, CaseKey, CaseStats, CaseSteps } from "@/components/case-facts";
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
    <h2
      id={slugify(textOf(children))}
      className="section-rule reveal mt-12 mb-3 scroll-mt-4 pt-3 text-lg font-medium md:scroll-mt-1"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(textOf(children))} className="reveal mt-4 mb-1 scroll-mt-4 text-base font-medium md:scroll-mt-1">
      {children}
    </h3>
  ),
  // Every block rises into view as you scroll (RevealObserver), one by one.
  p: (props) => <p className="reveal mb-2 text-base text-ink" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-3 text-base" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-3 text-base" {...props} />,
  li: (props) => <li className="reveal mb-0.5" {...props} />,
  a: (props) => <a className="link text-accent" {...props} />,
  strong: (props) => <strong className="font-medium" {...props} />,
  // Quotes fill in word by word as they scroll up the screen.
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-accent pl-3">
      <FillText text={textOf(children).trim()} className="text-lg font-light tracking-tight" />
    </blockquote>
  ),
  code: (props) => <code className="font-mono text-xs" {...props} />,
  CaseGallery,
  CaseCompare,
  CaseFindings,
  CaseKey,
  CaseStats,
  CaseSteps,
  CaseSection,
  CaseMedia,
  CaseMediaPair,
  CaseStatement,
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
