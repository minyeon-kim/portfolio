import Image from "next/image";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };

// As-is / To-be compared by scrolling. Both screens share one dark browser
// window (the opener's framing); as the block travels up the screen the To-be
// screen wipes in from the right over the As-is one (CSS scroll-driven
// animation on the figure's view timeline), with As-is | To-be chips riding
// the edge, and the two captions below trade emphasis. Nothing to find or
// press. Where scroll timelines are missing, on phones, or with reduced
// motion, the two screens sit side by side with their tags instead.
export function DevsignCompare({ before, after, labels }: { before: Side; after: Side; labels: { asIs: string; toBe: string; compare: string } }) {
  const sides = [
    { key: "before" as const, label: labels.asIs, side: before },
    { key: "after" as const, label: labels.toBe, side: after },
  ];
  return (
    <figure className="dv-wipe reveal" aria-label={labels.compare}>
      <div className="dv-wipe-window">
        <div className="dv-wipe-chrome" aria-hidden="true"><span /><span /><span /><i /></div>
        <div className="dv-wipe-frame">
          {sides.map(({ key, label, side }) => (
            <div key={key} className="dv-wipe-side" data-side={key}>
              <Image src={withBase(side.src)} alt={side.alt} width={960} height={540} sizes="(max-width: 767px) 100vw, 90vw" />
              <span className="dv-wipe-tag" aria-hidden="true">{label}</span>
            </div>
          ))}
          <div className="dv-wipe-edge" aria-hidden="true">
            <span className="dv-wipe-chip" data-side="before">{labels.asIs}</span>
            <span className="dv-wipe-chip" data-side="after">{labels.toBe}</span>
          </div>
        </div>
      </div>
      <figcaption className="dv-wipe-caption">
        {sides.map(({ key, label, side }) => (
          <span key={key} data-side={key}>
            <span className="dv-compare-label">{label}</span>
            <span className="dv-compare-text">{side.lead && <em>{side.lead}</em>}{side.text}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
