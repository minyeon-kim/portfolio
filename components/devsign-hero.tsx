import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiPhone } from "@/components/gemini-phone";
import { withBase } from "@/lib/site";

// Devsign wordmark face, as in the Figma hero.
const wordmark = Space_Grotesk({ weight: "700", subsets: ["latin"], display: "swap" });

export type DevsignHeroData = { title: string; details: { label: string; value: string }[] };

// The case opener, after the Figma "Hero" frame of the Devsign case study: logo
// and wordmark, a centered question, the prototype loop in a framed window
// (the frame's note asks for a looping recording), then Duration / Team / Role
// / Tools. Gemini uses the same layout with its own sparkle and phone loop.
// Used on the direct case page and on the home page's selected stage.
export function DevsignHero({ hero, name, alt, project }: { hero: DevsignHeroData; name: string; alt: string; project: string }) {
  const gemini = project === "gemini-privacy";
  return (
    <div className="devsign-hero" data-project={project}>
      <div className="devsign-hero-intro">
        <p className="devsign-hero-brand">
          {gemini
            ? <Image src={withBase("/images/cases/gemini-privacy/gemini-logo.png")} alt="" width={40} height={40} />
            : <Image src={withBase("/images/devsign/devsign-logo.svg")} alt="" width={42} height={40} />}
          <span className={gemini ? undefined : wordmark.className}>{name}</span>
        </p>
        <h1 tabIndex={-1} className="devsign-hero-title">{hero.title}</h1>
      </div>
      <div className="devsign-hero-media">
        {gemini ? <span className="devsign-hero-phone"><GeminiPhone alt={alt} /></span> : <DevsignLoop alt={alt} />}
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
