import { ui, type Locale } from "@/lib/i18n";
import Image from "next/image";
import { ProjectTitle } from "./project-title";
import { GeminiDevice } from "./gemini-device";
import { GeminiPhone } from "./gemini-phone";
import { DevsignLoop } from "./devsign-loop";
import { withBase } from "@/lib/site";

export function ProjectHero({ name, role, timeline, cover, concept, keywords, canvas = false, gemini = false, details: custom, locale = "en" }: {
  name: string;
  locale?: Locale;
  keywords?: string[];
  details?: { label: string; value?: string }[];
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
  canvas?: boolean;
  gemini?: boolean;
}) {
  const t = ui[locale];
  const details = (custom ?? [
    { label: t.projectType, value: concept ? t.conceptProject : t.product },
    { label: t.role, value: role },
    { label: t.timeline, value: timeline },
  ]).filter((item) => item.value);

  return (
    <header className="project-hero" data-canvas={canvas || undefined} data-gemini={gemini || undefined}>
      <div className="project-hero-heading">
        <h1 className="project-hero-title"><ProjectTitle name={name} gemini={gemini} /></h1>
        {keywords?.length ? (
          <ul className="project-hero-keywords" aria-label={t.keywords}>
            {keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}
          </ul>
        ) : null}
        <dl className="project-hero-details">
          {details.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {cover && (
        <div className="project-hero-cover">
          {gemini
            ? <GeminiDevice><GeminiPhone alt={`${name}: the Source badge opens a sheet where Gmail is switched off, and the line about Jeongmin leaves the answer`} /></GeminiDevice>
            : canvas
              ? <DevsignLoop alt={`${name}: a drifted Place order button is flagged, the review panel opens, and the designer approves the fix`} />
              : <Image src={withBase(cover)} alt={`${name} project overview`} width={1600} height={800} sizes="100vw" preload />}
        </div>
      )}
    </header>
  );
}
