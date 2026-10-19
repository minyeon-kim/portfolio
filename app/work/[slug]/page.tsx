import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConceptLabel } from "@/components/case-label";
import { getCase, getCaseSlugs } from "@/lib/cases";

export function generateStaticParams() {
  return getCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) return {};
  const { meta } = await getCase(slug);
  return { title: meta.title, description: meta.summary };
}

export default async function CasePage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) notFound();
  const { meta, Content } = await getCase(slug);

  return (
    <article className="mx-auto max-w-prose px-2 pt-8 pb-12">
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-1 font-mono text-xs text-muted">
          {meta.year && <span>{meta.year}</span>}
          {meta.role && <span>· {meta.role}</span>}
          {meta.concept && <ConceptLabel />}
        </div>
        <h1 className="mb-2 text-xl font-medium tracking-tight">{meta.title}</h1>
        <p className="text-base text-muted">{meta.summary}</p>
      </header>
      <Content />
    </article>
  );
}
