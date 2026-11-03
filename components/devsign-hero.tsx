import { Fragment } from "react";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { ArrowIcon } from "@/components/arrow-icon";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiPhone } from "@/components/gemini-phone";
import { HeroCanvas } from "@/components/hero-canvas";
import { DEVSIGN_URL, withBase } from "@/lib/site";

// Devsign wordmark face, as in the Figma hero.
const wordmark = Space_Grotesk({ weight: "700", subsets: ["latin"], display: "swap" });

export type DevsignHeroData = { title: string; subtitle?: string; actions?: { label: string; href: string; phoneHref?: string; primary?: boolean }[]; details: { label: string; value: string }[] };

// The case opener, laid out after railway.com's hero: one large framed panel,
// inset from the screen edges, holding the brand, a centered question, one line
// of what it is, the ways in, and the product itself running past the fold (the
// prototype's screens as a loop, the same one the home card shows, so nothing
// swaps after the page opens; its link is a small chip on the card). Duration /
// Team / Role / Tools follow under the panel.
// Behind it the product's dot canvas (HeroCanvas, with live cursors on Devsign)
// and a light from behind the product.
// Gemini uses the same layout with its own sparkle, phone loop and no cursors.
// Used on the direct case page and on the home page's selected stage.
export function DevsignHero({ hero, name, alt, project }: { hero: DevsignHeroData; name: string; alt: string; project: string }) {
  const gemini = project === "gemini-privacy";
  return (
    <div className="devsign-hero" data-project={project}>
      <div className="devsign-hero-panel">
      <HeroCanvas cursors={gemini ? undefined : ["Taylor", "Jordan"]} />
      <div className="devsign-hero-intro">
        <p className="devsign-hero-brand">
          {gemini
            ? <Image src={withBase("/images/cases/gemini-privacy/gemini-logo.png")} alt="" width={40} height={40} />
            : <Image src={withBase("/images/devsign/devsign-logo.svg")} alt="" width={42} height={40} />}
          <span className={gemini ? undefined : wordmark.className}>{name}</span>
        </p>
        <h1 tabIndex={-1} className="devsign-hero-title">{hero.title}</h1>
        {hero.subtitle && <p className="devsign-hero-subtitle">{hero.subtitle}</p>}
        {hero.actions && (
          <p className="devsign-hero-actions">
            {hero.actions.map((a) => (
              <Fragment key={a.href}>
                <a href={a.href} className="press" data-wide={a.phoneHref ? "" : undefined} data-primary={a.primary || undefined}>{a.label}{a.primary && <ArrowIcon />}</a>
                {/* The prototype is a desktop tool: phones open it in a new tab. */}
                {a.phoneHref && <a href={a.phoneHref} target="_blank" rel="noreferrer" className="press" data-phone="" data-primary={a.primary || undefined}>{a.label}{a.primary && <ArrowIcon />}</a>}
              </Fragment>
            ))}
          </p>
        )}
      </div>
      <div className="devsign-hero-media">
        {gemini
          ? <span className="devsign-hero-phone"><GeminiPhone alt={alt} /></span>
          : <div className="devsign-hero-window">
              <div className="devsign-hero-screen"><DevsignLoop alt={alt} /></div>
              <a className="devsign-hero-visit" href={DEVSIGN_URL} target="_blank" rel="noreferrer">minyeon-kim.github.io/devsign ↗</a>
            </div>}
      </div>
      </div>
      <dl className="devsign-hero-details">
        {hero.details.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
