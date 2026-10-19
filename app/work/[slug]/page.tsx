import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptLabel } from "@/components/case-label";
import { CaseNav } from "@/components/case-nav";
import { getCase, getCaseSlugs, getNextCase } from "@/lib/cases";

export function generateStaticParams() {
  return getCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) return {};
  const { meta, tldr } = await getCase(slug);
  return { title: meta.title, description: tldr.problem };
}

export default async function CasePage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!getCaseSlugs().includes(slug)) notFound();
  const { meta, toc, Content } = await getCase(slug);
  const next = await getNextCase(slug);

  const metaRow = [
    { label: "Role", value: meta.role },
    { label: "Timeline", value: meta.timeline },
    { label: "Tools", value: meta.tools?.join(", ") },
  ].filter((item) => item.value);

  return (
    <div className="mx-auto max-w-page px-2 pt-8 pb-12 md:px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_680px_minmax(0,1fr)] lg:gap-4">
      <aside className="lg:w-[200px] lg:justify-self-end">
        <CaseNav items={toc} />
      </aside>

      <article id="case-body" className="mx-auto max-w-prose">
        <header className="mb-6">
          {meta.concept && (
            <div className="mb-2">
              <ConceptLabel />
            </div>
          )}
          <h1 className="mb-4 text-xl font-medium tracking-tight">{meta.title}</h1>
          {metaRow.length > 0 && (
            <dl className="grid gap-2 border-t border-line pt-2 font-mono text-xs sm:grid-cols-3">
              {metaRow.map(({ label, value }) => (
                <div key={label}>
                  <dt className="mb-0.5 text-muted uppercase">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <Content />

        {next && (
          <nav aria-label="Next case" className="mt-12 border-t border-line pt-4">
            <Link href={`/work/${next.slug}/`} className="group block rounded-md">
              <span className="mb-1 block font-mono text-xs text-muted">Next case</span>
              <span className="flex items-baseline gap-1 text-lg font-medium">
                {next.meta.title}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-250 ease-standard group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
                >
                  →
                </span>
              </span>
              {next.tldr.problem && (
                <span className="mt-0.5 block text-sm text-muted">{next.tldr.problem}</span>
              )}
            </Link>
          </nav>
        )}
      </article>
    </div>
  );
}
