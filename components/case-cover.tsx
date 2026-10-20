import Image from "next/image";
import { ViewTransition } from "react";
import { withBase } from "@/lib/site";

// Edge-to-edge case cover. As it scrolls in, it opens from an inset, slightly
// tilted frame to the full width, and the image drifts inside it
// (.cover-expand / .cover-parallax in globals.css; static with reduced motion).
export function CaseCover({
  src,
  priority = false,
  morphName,
}: {
  src: string;
  priority?: boolean;
  morphName?: string; // pairs with the work selector preview so the cover morphs across pages
}) {
  return (
    <div className="full-bleed [perspective:1200px]">
      <div className="cover-expand aspect-[2/1] max-h-[80vh] w-full overflow-clip bg-surface">
        <Morph name={morphName}>
          <Image
            src={withBase(src)}
            alt=""
            width={1600}
            height={800}
            sizes="100vw"
            priority={priority}
            className="cover-parallax size-full object-cover"
          />
        </Morph>
      </div>
    </div>
  );
}

function Morph({ name, children }: { name?: string; children: React.ReactNode }) {
  if (!name) return children;
  return (
    <ViewTransition name={name} share="auto" default="none">
      {children}
    </ViewTransition>
  );
}
