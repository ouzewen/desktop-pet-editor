import type { breedArt } from './pet-assets';
import type { CatConfig } from './cat';

export type CatArtPalette = keyof typeof breedArt;
export type ColorCatBreedId = `CC${number}`;
export type CatFurColors = readonly [base: string, markings: string, pale: string];
type ColorCatBreed = {
  name: string;
  colors: CatFurColors;
  template?: CatArtPalette;
  appearance?: Partial<Pick<CatConfig, 'pattern' | 'bodyPattern' | 'eyeColor' | 'noseColor' | 'mouthContrast'>>;
};

const solidCoat = { pattern: 'P03', bodyPattern: 'plain' } as const;

// Entries here reuse the template's artwork and appearance defaults.
export const colorCatBreeds: Partial<Record<ColorCatBreedId, ColorCatBreed>> = {
  CC09: {
    name: '纯白猫', template: 'CC02', colors: ['#F5F3F0', '#DBD9DC', '#FFFEFB'],
    appearance: { ...solidCoat, eyeColor: 'iceBlue', noseColor: 'lightPink' },
  },
  CC10: {
    name: '玳瑁猫', template: 'CC03', colors: ['#CB793D', '#3E2D2D', '#34282A'],
    appearance: { eyeColor: 'honeyGold', mouthContrast: 'light' },
  },
  CC11: {
    name: '金渐层', template: 'CC02', colors: ['#E8BA72', '#976641', '#FFF0CA'],
    appearance: { ...solidCoat, eyeColor: 'green' },
  },
  CC12: {
    name: '淡三花', template: 'CC03', colors: ['#F2CAA1', '#9BA5B8', '#FFFAF3'],
    appearance: { eyeColor: 'olive', noseColor: 'lightPink' },
  },
};

export function colorCatBreed(id: ColorCatBreedId) {
  return Object.hasOwn(colorCatBreeds, id) ? colorCatBreeds[id] : undefined;
}
