// General husbandry reference values used by the free tools. These are typical
// figures from common keeping practice, not veterinary advice; every tool page
// says so. Temperatures in °C, sizes in cm.

export type IncubationInfo = {
  slug: string;
  name: string;
  tempC: [number, number];
  days: [number, number];
  note?: string;
};

export const INCUBATION: IncubationInfo[] = [
  { slug: "ball-python", name: "Ball python", tempC: [31, 32], days: [53, 60] },
  { slug: "corn-snake", name: "Corn snake", tempC: [27, 29], days: [55, 65] },
  { slug: "california-kingsnake", name: "California kingsnake", tempC: [27, 29], days: [55, 65] },
  { slug: "western-hognose", name: "Western hognose", tempC: [26, 28], days: [50, 60] },
  { slug: "carpet-python", name: "Carpet python", tempC: [30, 31.5], days: [50, 60] },
  { slug: "reticulated-python", name: "Reticulated python", tempC: [31, 32], days: [80, 90] },
  {
    slug: "leopard-gecko",
    name: "Leopard gecko",
    tempC: [27, 31],
    days: [40, 60],
    note: "Temperature sets sex: around 26–27 °C gives mostly females, around 32 °C mostly males, and very high temperatures (34 °C) give females again. Cooler incubation can take 70+ days.",
  },
  {
    slug: "african-fat-tailed-gecko",
    name: "African fat-tailed gecko",
    tempC: [28, 31],
    days: [45, 75],
    note: "Temperature-dependent sex determination, similar to leopard geckos.",
  },
  { slug: "crested-gecko", name: "Crested gecko", tempC: [22, 26], days: [60, 90], note: "Cooler incubation can take over 100 days." },
  { slug: "bearded-dragon", name: "Bearded dragon", tempC: [28, 30], days: [55, 75] },
];

export type EnclosureInfo = {
  slug: string;
  name: string;
  min: [number, number, number]; // length, width, height (cm)
  recommended: [number, number, number];
  note?: string;
};

const ft = (l: number, w: number, h: number): [number, number, number] => [l * 30.48, w * 30.48, h * 30.48];

export const ENCLOSURES: EnclosureInfo[] = [
  { slug: "ball-python", name: "Ball python (adult)", min: ft(4, 2, 2), recommended: ft(6, 2, 2), note: "Large females do best in 6 ft." },
  { slug: "corn-snake", name: "Corn snake (adult)", min: ft(4, 2, 2), recommended: ft(6, 2, 2) },
  { slug: "california-kingsnake", name: "California kingsnake (adult)", min: ft(3, 1.5, 1.5), recommended: ft(4, 2, 2) },
  { slug: "western-hognose", name: "Western hognose (adult)", min: ft(3, 1.5, 1.5), recommended: ft(4, 2, 2), note: "Males stay small; females need the larger size." },
  { slug: "common-boa", name: "Common boa (adult)", min: ft(6, 3, 3), recommended: ft(8, 3, 3) },
  { slug: "carpet-python", name: "Carpet python (adult)", min: ft(6, 2, 3), recommended: ft(8, 3, 4), note: "Semi-arboreal: add height and climbing branches." },
  { slug: "reticulated-python", name: "Reticulated python (adult)", min: ft(8, 4, 4), recommended: ft(10, 5, 5), note: "Dwarf locales can use smaller enclosures; mainland females need more." },
  { slug: "leopard-gecko", name: "Leopard gecko (adult)", min: ft(3, 1.5, 1.5), recommended: ft(4, 2, 2) },
  { slug: "african-fat-tailed-gecko", name: "African fat-tailed gecko (adult)", min: ft(3, 1.5, 1.5), recommended: ft(4, 2, 2) },
  { slug: "crested-gecko", name: "Crested gecko (adult)", min: ft(1.5, 1.5, 2), recommended: ft(2, 1.5, 3), note: "Arboreal: height matters more than floor space." },
  { slug: "bearded-dragon", name: "Bearded dragon (adult)", min: ft(4, 2, 2), recommended: ft(6, 2, 2) },
];

// Frozen-thawed feeder weight ranges in grams (typical US supplier sizes).
export const PREY: { kind: "Mouse" | "Rat"; size: string; grams: [number, number] }[] = [
  { kind: "Mouse", size: "Pinky", grams: [1, 3] },
  { kind: "Mouse", size: "Fuzzy", grams: [3, 6] },
  { kind: "Mouse", size: "Hopper", grams: [6, 10] },
  { kind: "Mouse", size: "Weaned", grams: [10, 17] },
  { kind: "Mouse", size: "Adult", grams: [17, 25] },
  { kind: "Mouse", size: "Large adult", grams: [25, 35] },
  { kind: "Mouse", size: "Jumbo", grams: [35, 50] },
  { kind: "Rat", size: "Pinky", grams: [5, 9] },
  { kind: "Rat", size: "Fuzzy", grams: [9, 20] },
  { kind: "Rat", size: "Pup", grams: [20, 40] },
  { kind: "Rat", size: "Weaned", grams: [40, 80] },
  { kind: "Rat", size: "Small", grams: [80, 150] },
  { kind: "Rat", size: "Medium", grams: [150, 250] },
  { kind: "Rat", size: "Large", grams: [250, 400] },
  { kind: "Rat", size: "X-large", grams: [400, 550] },
  { kind: "Rat", size: "Jumbo", grams: [550, 800] },
];
