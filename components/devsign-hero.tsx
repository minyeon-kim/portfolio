import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { DevsignLoop } from "@/components/devsign-loop";
import { withBase } from "@/lib/site";

// Devsign wordmark face, as in the Figma hero.
const wordmark = Space_Grotesk({ weight: "700", subsets: ["latin"], display: "swap" });

export type DevsignHeroData = { title: string; details: { label: string; value: string }[] };

// The Devsign opener, after the Figma "Hero" frame: logo and wordmark, a
// centered question, the prototype loop in a framed window (the frame's note
// asks for a looping recording), then Duration / Team / Role / Tools.
// Used on the direct case page and on the home page's selected stage.
export function DevsignHero({ hero, name, alt }: { hero: DevsignHeroData; name: string; alt: string }) {
  return (
    <div className="devsign-hero">
      <div className="devsign-hero-intro">
        <p className="devsign-hero-brand">
          <Image src={withBase("/images/devsign/devsign-logo.svg")} alt="" width={42} height={40} />
          <span className={wordmark.className}>{name}</span>
        </p>
        <h1 tabIndex={-1} className="devsign-hero-title">{hero.title}</h1>
      </div>
      <div className="devsign-hero-media">
        <DevsignLoop alt={alt} />
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
