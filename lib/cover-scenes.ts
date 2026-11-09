// The picture on each case cover: a scene with its screen cut out and the matrix3d that
// fits the product onto that screen. The landing card shows a crop of the same scene, so
// opening a case is one continuous picture. Crops are [x, y, w, h] in image pixels.
// Phone crops hold the whole device (Devsign the monitor on its plinth, about 1:1; Gemini the
// hand and phone, about 4:5) instead of a tall slice that cut the product's edges off.
export type Crop = [number, number, number, number];
export type CoverScene = { src: string; width: number; height: number; mediaWidth: number; mediaHeight: number; matrix: string; crop?: Crop; cropPhone: Crop; card: Crop; cardPhone: Crop; shadow?: { src: string; x: number; y: number; w: number; h: number } };

export const COVER_SCENES: Record<string, CoverScene> = {
  devsign: {
    src: "/images/devsign/cover-studio.webp",
    width: 1440, height: 838, mediaWidth: 1600, mediaHeight: 1000,
    matrix: "matrix3d(0.354389993, -0.00390579287, 0, -4.78566164e-05, -0.0354772607, 0.422775374, 0, -7.37381008e-06, 0, 0, 1, 0, 422.8, 119, 0, 1)",
    cropPhone: [330, 30, 800, 780], card: [24.5, 0, 1391, 838], cardPhone: [49.5, 0, 1341, 838],
  },
  "gemini-privacy": {
    src: "/images/cases/gemini-privacy/cover-hand.webp",
    width: 1666, height: 934, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.40607944, -0.0853739159, 0, 0.0000269248005, 0.114950928, 0.376466514, 0, -0.0000255890531, 0, 0, 1, 0, 570.766869, 174.52134, 0, 1)",
    crop: [3, 0, 1605, 934], cropPhone: [480, 30, 720, 904], card: [488, 0, 700, 934], cardPhone: [91, 0, 1494, 934],
    shadow: { src: "/images/cases/gemini-privacy/cover-hand-shadow.webp", x: 700, y: 400, w: 466.67, h: 466.67 },
  },
};
