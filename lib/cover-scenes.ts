// The picture on each case cover: a scene with its screen cut out and the matrix3d that
// fits the product onto that screen. The landing card shows a crop of the same scene, so
// opening a case is one continuous picture. Crops are [x, y, w, h] in image pixels.
// A scene with no matrix is a film still: the screens are already in the picture, and the
// cover plays the film over it (Devsign; the still per language comes from meta.hero.film).
// Phone crops hold the whole device (Devsign the monitor on its plinth, about 1:1; Gemini the
// hand and phone, about 4:5) instead of a tall slice that cut the product's edges off.
export type Crop = [number, number, number, number];
export type CoverScene = { src: string; width: number; height: number; mediaWidth?: number; mediaHeight?: number; matrix?: string; crop?: Crop; cropPhone: Crop; card: Crop; cardPhone: Crop; shadow?: { src: string; x: number; y: number; w: number; h: number } };

export const COVER_SCENES: Record<string, CoverScene> = {
  devsign: {
    // First frame of the hero film (1920x1080): two monitors in a dim office, the main one in the middle.
    src: "/images/devsign/hero/poster-en.webp",
    width: 1920, height: 1080,
    // Phones: the main monitor with the keyboard and hands. Landing card 1.66:1, phone card 16:10.
    cropPhone: [500, 40, 1040, 940], card: [63.5, 0, 1793, 1080], cardPhone: [96, 0, 1728, 1080],
  },
  "gemini-privacy": {
    src: "/images/cases/gemini-privacy/cover-hand.webp",
    width: 1666, height: 934, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.40607944, -0.0853739159, 0, 0.0000269248005, 0.114950928, 0.376466514, 0, -0.0000255890531, 0, 0, 1, 0, 570.766869, 174.52134, 0, 1)",
    crop: [3, 0, 1605, 934], cropPhone: [480, 30, 720, 904], card: [488, 0, 700, 934], cardPhone: [91, 0, 1494, 934],
    shadow: { src: "/images/cases/gemini-privacy/cover-hand-shadow.webp", x: 700, y: 400, w: 466.67, h: 466.67 },
  },
};
