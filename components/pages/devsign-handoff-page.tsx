import type { Metadata } from "next";
import Link from "next/link";
import { HandoffSpec } from "@/components/devsign-story";
import { Wireflow } from "@/components/devsign-wireflow";
import { SiteFooter } from "@/components/site-footer";
import { localize, type Locale } from "@/lib/i18n";
import { shareMeta, site } from "@/lib/site";

type Spec = React.ComponentProps<typeof HandoffSpec>["spec"] & { label: string; pageLead: string; back: string; screensLabel: string };
type Flow = { title: string; lead: string; nodes: React.ComponentProps<typeof Wireflow>["nodes"] };

// The full handoff: the wireflow and all four key screens. The case page shows one screen's key rules and links here.
async function deliverOf(locale: Locale) {
  const mod = locale === "ko" ? await import("@/content/ko/cases/devsign.mdx") : await import("@/content/cases/devsign.mdx");
  return (mod as unknown as { study: { deliver: { spec: Spec; handoff: Flow } } }).study.deliver;
}

export async function handoffMetadata(locale: Locale): Promise<Metadata> {
  const { spec } = await deliverOf(locale);
  const title = `Devsign: ${spec.label}`;
  return { title, description: spec.pageLead, ...shareMeta(localize("/work/devsign/handoff/", locale), `${title} — ${site.name}`, spec.pageLead, "devsign") };
}

export async function HandoffPage({ locale }: { locale: Locale }) {
  const { spec, handoff } = await deliverOf(locale);
  return (
    <article className="case-study dv-spec-page" data-project="devsign">
      <div className="dv">
        <section className="dv-section" aria-labelledby="spec-title">
          <p className="dv-spec-back"><Link className="link" href={localize("/work/devsign/", locale)}>{spec.back}</Link></p>
          <h1 id="spec-title" tabIndex={-1} className="dv-headline">{spec.label}</h1>
          <p className="dv-spec-lead">{spec.pageLead}</p>
          <h2 className="dv-spec-part">{handoff.title}</h2>
          <p className="dv-spec-lead">{handoff.lead}</p>
          <Wireflow nodes={handoff.nodes} label={handoff.lead} />
          <h2 className="dv-spec-part">{spec.screensLabel}</h2>
          <HandoffSpec spec={spec} />
        </section>
      </div>
      <SiteFooter />
    </article>
  );
}
