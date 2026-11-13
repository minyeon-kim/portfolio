// The picture on each case cover: a scene with its screen cut out and the matrix3d that
// fits the product onto that screen. The landing card shows a crop of the same scene, so
// opening a case is one continuous picture. Crops are [x, y, w, h] in image pixels.
// Phone crops hold the whole device (Devsign the monitor on its plinth, about 1:1; Gemini the
// hand and phone, about 4:5) instead of a tall slice that cut the product's edges off.
// A scene with no matrix is a film still (Devsign): the cover plays the film over it, from the
// still's own frame (meta.hero.film: src, start, the still per language).
export type Crop = [number, number, number, number];
export type CoverScene = { src: string; width: number; height: number; mediaWidth?: number; mediaHeight?: number; matrix?: string; crop?: Crop; cropPhone: Crop; card: Crop; cardPhone: Crop; shadow?: { src: string; x: number; y: number; w: number; h: number } };

export const COVER_SCENES: Record<string, CoverScene> = {
  devsign: {
    // The film's frame at 0.5s (its first shot, held), rendered at 3840x2160 and laid out at 1920x1080: the workspace
    // window floating on the purple-lit canvas.
    src: "/images/devsign/hero-film/still-en-v7.webp",
    width: 1920, height: 1080,
    // Desktop cover 16:8.6 (the plate), phones the whole 16:9 frame. The landing and phone cards
    // close in on the window (1.66:1 and 16:10): it fills about 72% of the card, with the purple
    // light of the upper left and lower right still showing round it.
    crop: [0, 24, 1920, 1032], cropPhone: [0, 0, 1920, 1080], card: [243, 103, 1440, 867], cardPhone: [243, 86, 1440, 900],
  },
  "gemini-privacy": {
    src: "/images/cases/gemini-privacy/cover-hand.webp",
    width: 1666, height: 934, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.40607944, -0.0853739159, 0, 0.0000269248005, 0.114950928, 0.376466514, 0, -0.0000255890531, 0, 0, 1, 0, 570.766869, 174.52134, 0, 1)",
    crop: [3, 0, 1605, 934], cropPhone: [480, 30, 720, 904], card: [488, 0, 700, 934], cardPhone: [91, 0, 1494, 934],
    shadow: { src: "/images/cases/gemini-privacy/cover-hand-shadow.webp", x: 700, y: 400, w: 466.67, h: 466.67 },
  },
};
