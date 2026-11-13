import { withBase } from "@/lib/site";

// A case's cover film (meta.hero.film) as the zoom layer needs it: the three files with the
// base path, and the frame it starts from.
export function filmOf(film?: { src: string; small?: string; large?: string; start?: number }) {
  if (!film) return undefined;
  return { src: withBase(film.src), small: film.small && withBase(film.small), large: film.large && withBase(film.large), start: film.start };
}
