import Image from "next/image";
import type { CSSProperties } from "react";
import { withBase } from "@/lib/site";

type Side = { src: string; alt: string; text: string; lead?: string };
// Box on the screenshot in percent of its width and height: [x, y, w, h].
type Box = [number, number, number, number];
type Change = { title: string; before: string; after: string; a?: Box; b?: Box };

const W = 960;
const H = 540;
const ASPECT = 16 / 10;

// The part of the screenshot to show for a box: the box plus some context,
// widened to one shared aspect (so every pair lines up) and kept inside the
// image. Returns the crop and the box inside it, both in percent.
function crop(box: Box) {
  const [bx, by, bw, bh] = [(box[0] / 100) * W, (box[1] / 100) * H, (box[2] / 100) * W, (box[3] / 100) * H];
  const pad = 28;
  let rw = Math.max(bw + pad * 2, (bh + pad * 2) * ASPECT, 340);
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

function Crop({ side, box, label, text, after }: { side: Side; box: Box; label: string; text: string; after?: boolean }) {
  const c = crop(box);
  return (
    <figure className="dv-crop" data-side={after ? "after" : "before"}>
      <div className="dv-crop-frame">
        <Image src={withBase(side.src)} alt="" width={W} height={H} sizes="(max-width: 767px) 200vw, 90vw" style={c.img as CSSProperties} />
        <span className="dv-crop-mark" style={c.mark} aria-hidden="true" />
        <span className="dv-crop-tag">{label}</span>
      </div>
      <figcaption>{text}</figcaption>
    </figure>
  );
}

// As-is / To-be, change by change. The two iteration layouts differ and a
// whole app screen is unreadable when shrunk, so each change gets its own row:
// a close-up of that area before and after, side by side, with one line each.
// The whole screens sit above as small thumbnails for context.
export function DevsignCompare({ before, after, changes = [], labels }: { before: Side; after: Side; changes?: Change[]; labels: { asIs: string; toBe: string; compare: string } }) {
  return (
    <div className="dv-crops reveal" aria-label={labels.compare} role="group">
      <div className="dv-crops-overview">
        {[{ key: "before", label: labels.asIs, side: before }, { key: "after", label: labels.toBe, side: after }].map(({ key, label, side }) => (
          <figure key={key} data-side={key}>
            <div className="dv-crops-thumb">
              <Image src={withBase(side.src)} alt={side.alt} width={W} height={H} sizes="(max-width: 767px) 100vw, 45vw" />
            </div>
            <figcaption>
              <span className="dv-compare-label">{label}</span>
              <span className="dv-crops-summary">{side.lead && <em>{side.lead}</em>}{side.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {changes.length > 0 && (
        <ol className="dv-crops-list">
          {changes.map((c, n) => (
            <li key={n}>
              <p className="dv-crops-title"><b aria-hidden="true">{n + 1}</b>{c.title}</p>
              <div className="dv-crops-pair">
                {c.a && <Crop side={before} box={c.a} label={labels.asIs} text={c.before} />}
                <span className="dv-crops-arrow" aria-hidden="true">→</span>
                {c.b && <Crop side={after} box={c.b} label={labels.toBe} text={c.after} after />}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
