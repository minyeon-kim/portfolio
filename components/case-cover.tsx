import Image from "next/image";

// Edge-to-edge case cover. As it scrolls in, it opens from an inset, slightly
// tilted frame to the full width, and the image drifts inside it
// (.cover-expand / .cover-parallax in globals.css; static with reduced motion).
export function CaseCover({ src, priority = false }: { src: string; priority?: boolean }) {
  return (
    <div className="full-bleed [perspective:1200px]">
      <div className="cover-expand aspect-[2/1] max-h-[80vh] w-full overflow-clip bg-surface">
        <Image
          src={src}
          alt=""
          width={1600}
          height={800}
          sizes="100vw"
          priority={priority}
          className="cover-parallax size-full object-cover"
        />
      </div>
    </div>
  );
}
