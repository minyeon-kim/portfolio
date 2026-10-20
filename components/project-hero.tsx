import Image from "next/image";
import { ProjectTitle } from "./project-title";
import { withBase } from "@/lib/site";

export function ProjectHero({ name, role, timeline, cover, concept, canvas = false, gemini = false }: {
  name: string;
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
  canvas?: boolean;
  gemini?: boolean;
}) {
  const details = [
    { label: "Project Type", value: concept ? "Concept project" : "Product" },
    { label: "Role", value: role },
    { label: "Timeline", value: timeline },
  ].filter((item) => item.value);

  return (
    <header className="project-hero" data-canvas={canvas || undefined} data-gemini={gemini || undefined}>
      <div className="project-hero-heading">
        <h1 className="project-hero-title"><ProjectTitle name={name} gemini={gemini} /></h1>
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
          <Image src={withBase(cover)} alt={`${name} project overview`} width={gemini ? 1000 : 1600} height={gemini ? 1100 : 800} sizes="100vw" preload />
        </div>
      )}
    </header>
  );
}
