import type { Metadata } from "next";
import Link from "next/link";
import { HandoffSpec } from "@/components/devsign-story";
import { SiteFooter } from "@/components/site-footer";
import { localize, type Locale } from "@/lib/i18n";
import { shareMeta, site } from "@/lib/site";

type Spec = React.ComponentProps<typeof HandoffSpec>["spec"] & { label: string; pageLead: string; back: string };

// The full handoff spec, all four key screens. The case page shows one of them and links here.
async function specOf(locale: Locale) {
  const mod = locale === "ko" ? await import("@/content/ko/cases/devsign.mdx") : await import("@/content/cases/devsign.mdx");
  return (mod as unknown as { study: { deliver: { spec: Spec } } }).study.deliver.spec;
}

export async function handoffMetadata(locale: Locale): Promise<Metadata> {
  const spec = await specOf(locale);
  const title = `Devsign: ${spec.label}`;
  return { title, description: spec.pageLead, ...shareMeta(localize("/work/devsign/handoff/", locale), `${title} — ${site.name}`, spec.pageLead, "devsign") };
}

export async function HandoffPage({ locale }: { locale: Locale }) {
  const spec = await specOf(locale);
  return (
    <article className="case-study dv-spec-page" data-project="devsign">
      <div className="dv">
        <section className="dv-section" aria-labelledby="spec-title">
          <p className="dv-spec-back"><Link className="link" href={localize("/work/devsign/", locale)}>{spec.back}</Link></p>
          <h1 id="spec-title" tabIndex={-1} className="dv-headline">{spec.label}</h1>
          <p className="dv-spec-lead">{spec.pageLead}</p>
          <HandoffSpec spec={spec} />
        </section>
      </div>
      <SiteFooter />
    </article>
  );
}
