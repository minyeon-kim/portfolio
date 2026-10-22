import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { withBase } from "@/lib/site";

export function CaseSection({ id, label, title, children, layout = "split" }: { id: string; label: string; title: string; children: ReactNode; layout?: "split" | "wide" }) {
  return (
    <section id={id} className={`case-section case-section-${layout}`} aria-labelledby={`${id}-title`}>
      <p className="case-eyebrow reveal">{label}</p>
      <div className="case-section-grid">
        <h2 id={`${id}-title`} className="case-section-title reveal">{title}</h2>
        <div className="case-section-copy">{children}</div>
      </div>
    </section>
  );
}

type MediaProps = {
  label: string;
  caption?: string;
  variant?: "wide" | "screen" | "portrait" | "phone" | "logo";
  // With a src the image is shown at its own aspect ratio; without one, a labelled placeholder.
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export function CaseMedia({ label, caption, variant = "wide", src, alt, width = 1600, height = 1000 }: MediaProps) {
  return (
    <figure className={`case-media case-media-${variant} reveal`}>
      {src ? (
        <div className="case-media-image">
          <Image src={withBase(src)} alt={alt ?? label} width={width} height={height} sizes={variant === "phone" ? "(max-width: 767px) 50vw, 320px" : "(max-width: 767px) 100vw, 880px"} />
        </div>
      ) : (
        <div className="case-media-space" role="img" aria-label={`Image placeholder: ${label}`}>
          <span className="case-media-index" aria-hidden="true">↗</span>
          <span className="case-media-label">{label}</span>
          <span className="case-media-note">Image to come</span>
          <span className="case-media-outline" aria-hidden="true" />
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function CaseMediaPair({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className="case-media-pair" style={{ "--media-columns": columns } as CSSProperties}>{children}</div>;
}

export function CaseStatement({ children }: { children: ReactNode }) {
  return <div className="case-statement reveal">{children}</div>;
}

// Slot for the playable prototype. For now it reserves the frame and links out;
// the embed will load only after a click, so the page stays light.
export function CasePrototype({ label, href, device = "desktop" }: { label: string; href: string; device?: "phone" | "desktop" }) {
  return (
    <figure className={`case-prototype case-prototype-${device} reveal`}>
      <div className="case-prototype-frame" role="img" aria-label={`Prototype placeholder: ${label}`}>
        <span className="case-prototype-kicker">Interactive prototype</span>
        <span className="case-prototype-label">{label}</span>
        <span className="case-media-note">Playable here soon</span>
        <a href={href} target="_blank" rel="noreferrer" className="case-prototype-open">Open the prototype ↗</a>
      </div>
    </figure>
  );
}
