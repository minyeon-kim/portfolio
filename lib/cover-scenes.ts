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
    cropPhone: [493, 0, 484, 838], card: [49.5, 0, 1341, 838], cardPhone: [49.5, 0, 1341, 838],
  },
  "gemini-privacy": {
    src: "/images/cases/gemini-privacy/cover-hand.webp",
    width: 1536, height: 864, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.408803461, -0.0429530057, 0, 3.23777877e-05, 0.0659493613, 0.374605389, 0, -2.07875042e-05, 0, 0, 1, 0, 624.291913, 115.680511, 0, 1)",
    crop: [26, 0, 1484, 864], cropPhone: [600, 0, 499, 864], card: [444, 0, 648, 864], cardPhone: [77, 0, 1382, 864],
  },
};
