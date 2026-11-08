// The picture on each case cover: a scene with its screen cut out and the matrix3d that
// fits the product onto that screen. The landing card shows a crop of the same scene, so
// opening a case is one continuous picture. Crops are [x, y, w, h] in image pixels.
export type Crop = [number, number, number, number];
export type CoverScene = { src: string; width: number; height: number; mediaWidth: number; mediaHeight: number; matrix: string; crop?: Crop; cropPhone: Crop; card: Crop; cardPhone: Crop };

export const COVER_SCENES: Record<string, CoverScene> = {
  devsign: {
    src: "/images/devsign/cover-studio.webp",
    width: 1440, height: 838, mediaWidth: 1343, mediaHeight: 1000,
    matrix: "matrix3d(0.386063256, -0.00403789807, 0, -5.14754927e-05, -0.038678209, 0.460135074, 0, -8.08801034e-06, 0, 0, 1, 0, 439.34355, 83.8615, 0, 1)",
    cropPhone: [493, 0, 484, 838], card: [24.5, 0, 1391, 838], cardPhone: [49.5, 0, 1341, 838],
  },
  "gemini-privacy": {
    src: "/images/cases/gemini-privacy/cover-hand.webp",
    width: 1666, height: 934, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.40607944, -0.0853739159, 0, 0.0000269248005, 0.114950928, 0.376466514, 0, -0.0000255890531, 0, 0, 1, 0, 570.766869, 174.52134, 0, 1)",
    crop: [3, 0, 1605, 934], cropPhone: [568, 0, 540, 934], card: [488, 0, 700, 934], cardPhone: [91, 0, 1494, 934],
  },
};
