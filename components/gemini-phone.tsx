import Image from "next/image";
import { withBase } from "@/lib/site";

// The Gemini hero: the prototype's own screens inside the phone, looping the one
// moment the project is about. An answer mentions Jungmin, the Source badge
// pulses, the source sheet slides up and Gmail switches off, then the line
// about Jungmin leaves the answer. Positions are percentages of the 750x1624
// screenshot (screen-a2-badge.webp); the frame is phone-frame.svg (1000x1100).
export function GeminiPhone({ alt }: { alt: string }) {
  const dir = "/images/cases/gemini-privacy";
  return (
    <div className="gemini-phone" role="img" aria-label={alt}>
      <Image className="gemini-phone-frame" src={withBase(`${dir}/phone-frame.svg`)} alt="" width={1000} height={1100} preload />
      <div className="gemini-phone-display">
        <div className="gemini-phone-stage">
          <Image src={withBase(`${dir}/screen-a2-badge.webp`)} alt="" width={750} height={1624} sizes="400px" preload />
          <span className="gemini-phone-forget" />
          <span className="gemini-phone-badge" />
          <span className="gemini-phone-dim" />
          <div className="gemini-phone-sheet">
            <Image src={withBase(`${dir}/hero-sheet.webp`)} alt="" width={750} height={1249} sizes="400px" />
            <span className="gemini-phone-toggle"><span /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
