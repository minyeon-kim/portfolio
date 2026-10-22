import Image from "next/image";
import { ProjectTitle } from "./project-title";
import { GeminiDevice } from "./gemini-device";
import { withBase } from "@/lib/site";

export function ProjectHero({ name, role, timeline, cover, concept, keywords, canvas = false, gemini = false, details: custom }: {
  name: string;
  keywords?: string[];
  details?: { label: string; value?: string }[];
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
  canvas?: boolean;
  gemini?: boolean;
}) {
  const details = (custom ?? [
    { label: "Project Type", value: concept ? "Concept project" : "Product" },
    { label: "Role", value: role },
    { label: "Timeline", value: timeline },
  ]).filter((item) => item.value);

  return (
    <header className="project-hero" data-canvas={canvas || undefined} data-gemini={gemini || undefined}>
      <div className="project-hero-heading">
        <h1 className="project-hero-title"><ProjectTitle name={name} gemini={gemini} /></h1>
        {keywords?.length ? (
          <ul className="project-hero-keywords" aria-label="Keywords">
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
            ? <GeminiDevice><Image src={withBase(cover)} alt={`${name} project overview`} width={1000} height={1100} sizes="100vw" preload /></GeminiDevice>
            : <Image src={withBase(cover)} alt={`${name} project overview`} width={1600} height={800} sizes="100vw" preload />}
        </div>
      )}
    </header>
  );
}
