import Image from "next/image";
import { withBase } from "@/lib/site";

// The Devsign hero: the prototype's own screens, looping the one moment the
// tool is for. A drifted Place order button is flagged on the Checkout screen,
// the review panel slides in, the designer approves, and the panel moves on to
// Fix · Verify with the before and after side by side. Positions are
// percentages of the 1440x900 capture (hero-base.webp).
export function DevsignLoop({ alt }: { alt: string }) {
  const dir = "/images/cases/workflow-app";
  return (
    <div className="devsign-loop" role="img" aria-label={alt}>
      <Image src={withBase(`${dir}/hero-base.webp`)} alt="" width={1920} height={1200} sizes="(max-width: 767px) 100vw, 1280px" preload />
      <span className="devsign-loop-pin" />
      <div className="devsign-loop-panel">
        <Image src={withBase(`${dir}/hero-panel-review.webp`)} alt="" width={960} height={1685} sizes="(max-width: 767px) 34vw, 430px" />
        <Image className="devsign-loop-approved" src={withBase(`${dir}/hero-panel-approved.webp`)} alt="" width={960} height={1685} sizes="(max-width: 767px) 34vw, 430px" />
        <span className="devsign-loop-approve" />
      </div>
    </div>
  );
}
