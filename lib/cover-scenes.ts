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
    width: 1772, height: 864, mediaWidth: 800, mediaHeight: 1734,
    matrix: "matrix3d(0.399313394, -0.099076807, 0, 0.0000140911643, 0.0984747639, 0.384047689, 0, -0.0000295637161, 0, 0, 1, 0, 695.750504, 103.599083, 0, 1)",
    crop: [190, 0, 1484, 864], cropPhone: [712, 0, 499, 864], card: [638, 0, 648, 864], cardPhone: [271, 0, 1382, 864],
  },
};
