import Image from "next/image";
import { withBase } from "@/lib/site";

export function ProjectTitle({ name, gemini }: { name: string; gemini: boolean }) {
  if (!gemini) return name;
  return (
    <span className="gemini-title-lines">
      <span className="gemini-title-first">Gemini<Image src={withBase("/images/cases/gemini-privacy/gemini-logo.png")} alt="" width={72} height={72} className="gemini-brand-mark" /></span>
      <span>privacy revamp</span>
    </span>
  );
}
