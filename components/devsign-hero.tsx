import { ArrowIcon } from "@/components/arrow-icon";
import { DevsignLoop } from "@/components/devsign-loop";
import { HeroClip } from "@/components/hero-clip";
import { HeroShot } from "@/components/hero-shot";
import { GeminiPhone } from "@/components/gemini-phone";
import { COVER_SCENES } from "@/lib/cover-scenes";
import { withBase } from "@/lib/site";

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
  const scene = COVER_SCENES[project];
  return (
    <div className="devsign-hero dh-cover" data-project={project}>
      <div className="devsign-hero-intro">
        <h1 tabIndex={-1} className="devsign-hero-title" translate="no">{gemini ? <>Gemini <br />privacy revamp</> : name}</h1>
        <p className="devsign-hero-question">{hero.title}</p>
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
      <div className="dh-lead">
        <dl className="devsign-hero-details">
        {hero.details.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        </dl>
      </div>
      <div className="dh-cover-plate">
        {gemini ? (
          <HeroShot {...scene} src={withBase(scene.src)} alt="">
            <div className="devsign-hero-media">
              {hero.clip
                ? <HeroClip src={withBase(hero.clip.src)} poster={withBase(hero.clip.poster)} label={hero.clip.label} />
                : <span className="devsign-hero-phone"><GeminiPhone alt={alt} preload /></span>}
            </div>
          </HeroShot>
        ) : (
          <HeroShot {...scene} src={withBase(scene.src)} alt="">
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
