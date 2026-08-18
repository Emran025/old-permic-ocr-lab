export type SyntheticTrainingGalleryItem = {
  id: string;
  classId: number;
  glyph: string;
  codepoint: string;
  unicodeName: string;
  imageUrl: string;
  split: "train";
  seed: number;
};

const classGallery = [
  [0, "𐍐", "U+10350", "OLD PERMIC LETTER AN", "/manus-storage/s0-v1-class-00_83f6c8a7.png"],
  [1, "𐍑", "U+10351", "OLD PERMIC LETTER BUR", "/manus-storage/s0-v1-class-01_608dda91.png"],
  [2, "𐍒", "U+10352", "OLD PERMIC LETTER GAI", "/manus-storage/s0-v1-class-02_fa14cb52.png"],
  [3, "𐍓", "U+10353", "OLD PERMIC LETTER DOI", "/manus-storage/s0-v1-class-03_0dc327e9.png"],
  [4, "𐍔", "U+10354", "OLD PERMIC LETTER E", "/manus-storage/s0-v1-class-04_8cb1c5b4.png"],
  [5, "𐍕", "U+10355", "OLD PERMIC LETTER ZHOI", "/manus-storage/s0-v1-class-05_73be1afe.png"],
  [6, "𐍖", "U+10356", "OLD PERMIC LETTER DZHOI", "/manus-storage/s0-v1-class-06_54ef185a.png"],
  [7, "𐍗", "U+10357", "OLD PERMIC LETTER ZATA", "/manus-storage/s0-v1-class-07_fb810def.png"],
  [8, "𐍘", "U+10358", "OLD PERMIC LETTER DZITA", "/manus-storage/s0-v1-class-08_4bb514c0.png"],
  [9, "𐍙", "U+10359", "OLD PERMIC LETTER I", "/manus-storage/s0-v1-class-09_da071af2.png"],
  [10, "𐍚", "U+1035A", "OLD PERMIC LETTER KOKE", "/manus-storage/s0-v1-class-10_89aba9a6.png"],
  [11, "𐍛", "U+1035B", "OLD PERMIC LETTER LEI", "/manus-storage/s0-v1-class-11_559e8da0.png"],
  [12, "𐍜", "U+1035C", "OLD PERMIC LETTER MENOE", "/manus-storage/s0-v1-class-12_405c0a2c.png"],
  [13, "𐍝", "U+1035D", "OLD PERMIC LETTER NENOE", "/manus-storage/s0-v1-class-13_36f15f2e.png"],
  [14, "𐍞", "U+1035E", "OLD PERMIC LETTER VOOI", "/manus-storage/s0-v1-class-14_1aec79bc.png"],
  [15, "𐍟", "U+1035F", "OLD PERMIC LETTER PEEI", "/manus-storage/s0-v1-class-15_6f21c0f9.png"],
  [16, "𐍠", "U+10360", "OLD PERMIC LETTER REI", "/manus-storage/s0-v1-class-16_56d30a69.png"],
  [17, "𐍡", "U+10361", "OLD PERMIC LETTER SII", "/manus-storage/s0-v1-class-17_52b237cf.png"],
  [18, "𐍢", "U+10362", "OLD PERMIC LETTER TAI", "/manus-storage/s0-v1-class-18_4be39574.png"],
  [19, "𐍣", "U+10363", "OLD PERMIC LETTER U", "/manus-storage/s0-v1-class-19_a0dc6e9f.png"],
  [20, "𐍤", "U+10364", "OLD PERMIC LETTER CHERY", "/manus-storage/s0-v1-class-20_3bdb9ff7.png"],
  [21, "𐍥", "U+10365", "OLD PERMIC LETTER SHOOI", "/manus-storage/s0-v1-class-21_b572134e.png"],
  [22, "𐍦", "U+10366", "OLD PERMIC LETTER SHCHOOI", "/manus-storage/s0-v1-class-22_884ef3c8.png"],
  [23, "𐍧", "U+10367", "OLD PERMIC LETTER YRY", "/manus-storage/s0-v1-class-23_371d1e7f.png"],
  [24, "𐍨", "U+10368", "OLD PERMIC LETTER YERU", "/manus-storage/s0-v1-class-24_f1ab0bdf.png"],
  [25, "𐍩", "U+10369", "OLD PERMIC LETTER O", "/manus-storage/s0-v1-class-25_16f87d43.png"],
  [26, "𐍪", "U+1036A", "OLD PERMIC LETTER OO", "/manus-storage/s0-v1-class-26_bddf0cb4.png"],
  [27, "𐍫", "U+1036B", "OLD PERMIC LETTER EF", "/manus-storage/s0-v1-class-27_f6533996.png"],
  [28, "𐍬", "U+1036C", "OLD PERMIC LETTER HA", "/manus-storage/s0-v1-class-28_bce958c9.png"],
  [29, "𐍭", "U+1036D", "OLD PERMIC LETTER TSIU", "/manus-storage/s0-v1-class-29_9835134b.png"],
  [30, "𐍮", "U+1036E", "OLD PERMIC LETTER VER", "/manus-storage/s0-v1-class-30_655806df.png"],
  [31, "𐍯", "U+1036F", "OLD PERMIC LETTER YER", "/manus-storage/s0-v1-class-31_97093688.png"],
  [32, "𐍰", "U+10370", "OLD PERMIC LETTER YERI", "/manus-storage/s0-v1-class-32_7b11152c.png"],
  [33, "𐍱", "U+10371", "OLD PERMIC LETTER YAT", "/manus-storage/s0-v1-class-33_aa09e29a.png"],
  [34, "𐍲", "U+10372", "OLD PERMIC LETTER IE", "/manus-storage/s0-v1-class-34_68e74f52.png"],
  [35, "𐍳", "U+10373", "OLD PERMIC LETTER YU", "/manus-storage/s0-v1-class-35_5f8ff7c4.png"],
  [36, "𐍴", "U+10374", "OLD PERMIC LETTER YA", "/manus-storage/s0-v1-class-36_bcc35dc8.png"],
  [37, "𐍵", "U+10375", "OLD PERMIC LETTER IA", "/manus-storage/s0-v1-class-37_fea4ed35.png"],
] as const;

export const syntheticTrainingGallery: SyntheticTrainingGalleryItem[] = classGallery.map(([classId, glyph, codepoint, unicodeName, imageUrl]) => ({
  id: `s0-unicode-clean-class-${String(classId).padStart(2, "0")}`,
  classId,
  glyph,
  codepoint,
  unicodeName,
  imageUrl,
  split: "train",
  seed: 10350 + classId,
}));

export const syntheticTrainingSummary = {
  release: "S0 Unicode Clean · v1",
  totalImages: 7600,
  trainImages: 6080,
  validationImages: 760,
  testImages: 760,
  classes: 38,
  instancesPerClass: { train: 160, validation: 20, test: 20 },
  fontFamily: "Noto Sans Old Permic Regular",
  fontSha256: "f2eb57a47f62d490cb8a5efab95124f15b8941968cb03af780b939bae3b73006",
  generatorLayout: "isolated-glyph",
  generatorProfile: "unicode-clean",
  seed: 10350,
  trainingBoundary: "هذه صور صناعية منشأة من خط. لا تدخل corpus المخطوطات ولا تثبت أداء OCR على الخط التاريخي.",
} as const;
