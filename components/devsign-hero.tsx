import { ArrowIcon } from "@/components/arrow-icon";
import { DevsignLoop } from "@/components/devsign-loop";
import { HeroClip } from "@/components/hero-clip";
import { HeroShot } from "@/components/hero-shot";
import { GeminiPhone } from "@/components/gemini-phone";
import { DEVSIGN_URL, withBase } from "@/lib/site";

export type DevsignHeroData = { title: string; subtitle?: string; card?: { src: string; width: number; height: number; alt: string }; clip?: { src: string; poster: string; label: string }; actions?: { label: string; href: string; primary?: boolean }[]; details: { label: string; value: string }[] };

// The case opener, after metalab.com's case covers: the brand and the question on the
// page itself (left-aligned on the 1200 case column), then one cover plate in the
// project's colour holding the product (the prototype loop, or the Gemini phone),
// cropped by the plate's bottom edge, with one cut-out of the moment the case is
// about laid over its lower right (Devsign: the decision with its reason; Gemini:
// the sheet of information used in an answer). Project / Team / Role / Tools follow
// under the plate. Used on the direct case page and on the home page's selected stage;
// .devsign-hero-media stays the element the page transitions measure.
export function DevsignHero({ hero, name, alt, project }: { hero: DevsignHeroData; name: string; alt: string; project: string }) {
  const gemini = project === "gemini-privacy";
  return (
    <div className="devsign-hero dh-cover" data-project={project}>
      <div className="devsign-hero-intro">
        <h1 tabIndex={-1} className="devsign-hero-title" translate="no">{name}</h1>
        {hero.actions && (
          <p className="devsign-hero-actions">
            {hero.actions.map((a) => (
              a.href.startsWith("http")
                ? <a key={a.href} href={a.href} target="_blank" rel="noreferrer" className="press" data-primary={a.primary || undefined}>{a.label}</a>
                : <a key={a.href} href={a.href} className="press" data-primary={a.primary || undefined}>{a.label}{a.primary && <ArrowIcon />}</a>
            ))}
          </p>
        )}
      </div>
      <dl className="devsign-hero-details">
        {hero.details.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="dh-cover-plate">
        {gemini ? (
          <HeroShot src={withBase("/images/cases/gemini-privacy/cover-hand.webp")} width={1536} height={864} alt="" mediaWidth={800} mediaHeight={1734} crop={[26, 0, 1484, 864]} cropPhone={[600, 0, 499, 864]}
            matrix="matrix3d(0.429803949, -0.0179177791, 0, 4.05424448e-05, 0.0685022387, 0.388183516, 0, -2.13469489e-05, 0, 0, 1, 0, 615.983241, 94.0695278, 0, 1)">
            <div className="devsign-hero-media">
              {hero.clip
                ? <HeroClip src={withBase(hero.clip.src)} poster={withBase(hero.clip.poster)} label={hero.clip.label} />
                : <span className="devsign-hero-phone"><GeminiPhone alt={alt} preload /></span>}
            </div>
          </HeroShot>
        ) : (
          <HeroShot src={withBase("/images/devsign/cover-studio.webp")} width={1536} height={864} alt="" mediaWidth={1280} mediaHeight={1000} crop={[26, 0, 1484, 864]} cropPhone={[520, 0, 499, 864]}
            matrix="matrix3d(0.263523203, -0.0732849087, 0, -0.000161821789, 1.06595066e-16, 0.397990037, 0, 1.03063094e-19, 0, 0, 1, 0, 482.73, 171.784671, 0, 1)">
            <div className="devsign-hero-media">
              <div className="devsign-hero-window">
                <div className="devsign-hero-screen"><DevsignLoop alt={alt} preload /></div>
              </div>
              {hero.clip && <HeroClip src={withBase(hero.clip.src)} poster={withBase(hero.clip.poster)} label={hero.clip.label} />}
            </div>
          </HeroShot>
        )}
        {hero.card && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dh-cover-card" src={withBase(hero.card.src)} width={hero.card.width} height={hero.card.height} alt={hero.card.alt} decoding="async" />
        )}
      </div>
    </div>
  );
}
