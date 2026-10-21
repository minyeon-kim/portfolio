import type { ReactNode } from "react";

export function CaseSection({ id, label, title, children }: { id: string; label: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="case-section" aria-labelledby={`${id}-title`}>
      <p className="case-eyebrow reveal">{label}</p>
      <div className="case-section-grid">
        <h2 id={`${id}-title`} className="case-section-title reveal">{title}</h2>
        <div className="case-section-copy">{children}</div>
      </div>
    </section>
  );
}

export function CaseMedia({ label, caption, variant = "wide" }: { label: string; caption?: string; variant?: "wide" | "screen" | "portrait" }) {
  return (
    <figure className={`case-media case-media-${variant} reveal`}>
      <div className="case-media-space" role="img" aria-label={`Image placeholder: ${label}`}>
        <span className="case-media-index" aria-hidden="true">↗</span>
        <span className="case-media-label">{label}</span>
        <span className="case-media-note">Image to come</span>
        <span className="case-media-outline" aria-hidden="true" />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function CaseMediaPair({ children }: { children: ReactNode }) {
  return <div className="case-media-pair">{children}</div>;
}

export function CaseStatement({ children }: { children: ReactNode }) {
  return <div className="case-statement reveal">{children}</div>;
}
