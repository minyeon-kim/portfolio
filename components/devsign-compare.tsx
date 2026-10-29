import Image from "next/image";
import type { CSSProperties } from "react";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };
// Box on the screenshot in percent of its width and height: [x, y, w, h].
type Box = [number, number, number, number];
type Change = { title: string; before: string; after: string; a?: Box; b?: Box };

// Screenshots are captured from the prototype at 1440×810, twice the pixels.
const W = 1440;
const H = 810;
const ASPECT = 16 / 10;

// The part of the screenshot to show for a box: the box plus some context,
// widened to one shared aspect and kept inside the image. Returns the crop and
// the box inside it, both in percent.
function crop(box: Box) {
  const [bx, by, bw, bh] = [(box[0] / 100) * W, (box[1] / 100) * H, (box[2] / 100) * W, (box[3] / 100) * H];
  const pad = 40;
  let rw = Math.max(bw + pad * 2, (bh + pad * 2) * ASPECT, 400);
  let rh = rw / ASPECT;
  if (rh > H) { rh = H; rw = H * ASPECT; }
  if (rw > W) { rw = W; rh = W / ASPECT; }
  const rx = Math.min(Math.max(bx + bw / 2 - rw / 2, 0), W - rw);
  const ry = Math.min(Math.max(by + bh / 2 - rh / 2, 0), H - rh);
  return {
    img: { width: `${(W / rw) * 100}%`, left: `${(-rx / rw) * 100}%`, top: `${(-ry / rh) * 100}%` },
    mark: { left: `${((bx - rx) / rw) * 100}%`, top: `${((by - ry) / rh) * 100}%`, width: `${(bw / rw) * 100}%`, height: `${(bh / rh) * 100}%` },
  };
}

function Crop({ src, box }: { src: string; box: Box }) {
  const c = crop(box);
  return (
    <div className="dv-zoom">
      <Image src={withBase(src)} alt="" width={W * 2} height={H * 2} sizes="(max-width: 767px) 300vw, 100vw" style={c.img as CSSProperties} />
      <span className="dv-zoom-mark" style={c.mark} aria-hidden="true" />
    </div>
  );
}

// As-is / To-be: the two whole screens side by side carry the comparison. Under
// them, the three changes that matter as cards in one row: a close-up of the
// To-be screen with the changed area outlined, a title, and one line from
// before to after.
export function DevsignCompare({ before, after, changes = [], labels }: { before: Side; after: Side; changes?: Change[]; labels: { asIs: string; toBe: string; compare: string } }) {
  return (
    <div className="dv-crops reveal" aria-label={labels.compare} role="group">
      <div className="dv-crops-overview">
        {[{ key: "before", label: labels.asIs, side: before }, { key: "after", label: labels.toBe, side: after }].map(({ key, label, side }) => (
          <figure key={key} data-side={key}>
            <div className="dv-crops-thumb">
              <Image src={withBase(side.src)} alt={side.alt} width={W * 2} height={H * 2} sizes="(max-width: 767px) 100vw, 45vw" />
            </div>
            <figcaption>
              <span className="dv-compare-label">{label}</span>
              <span className="dv-crops-summary">{side.lead && <em>{side.lead}</em>}{side.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {changes.length > 0 && (
        <ol className="dv-points">
          {changes.map((c, n) => (
            <li key={n} className="dv-point">
              {c.b && <div className="dv-point-media"><Crop src={after.src} box={c.b} /></div>}
              <p className="dv-point-title"><b aria-hidden="true">{n + 1}</b>{c.title}</p>
              <p className="dv-point-change">
                <span className="dv-point-before">{c.before}</span>
                <span className="dv-point-after">{c.after}</span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
