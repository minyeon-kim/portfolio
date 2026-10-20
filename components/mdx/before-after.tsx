import Image from "next/image";
import { withBase } from "@/lib/site";

type Img = { src: string; alt: string };
type Props = { before: Img; after: Img; width: number; height: number; caption?: string };

export function BeforeAfter({ before, after, width, height, caption }: Props) {
  return (
    <figure className="case-comparison">
      <div className="case-comparison-grid">
        {[{ label: "Before", ...before }, { label: "After", ...after }].map(({ label, src, alt }) => (
          <div key={label} className="reveal">
            <p className="case-comparison-label">{label}</p>
            <Image src={withBase(src)} alt={alt} width={width} height={height} sizes="(max-width: 767px) 100vw, 50vw" className="w-full" />
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
