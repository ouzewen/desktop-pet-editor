import type { breedArt } from './pet-assets';

export type CatArtPalette = keyof typeof breedArt;
export type ColorCatBreedId = `CC${number}`;
export type CatFurColors = readonly [base: string, markings: string, pale: string];
type ColorCatBreed = {
  name: string;
  colors: CatFurColors;
  template?: CatArtPalette;
};

// Entries here reuse the template's artwork and appearance defaults.
export const colorCatBreeds: Partial<Record<ColorCatBreedId, ColorCatBreed>> = {
};

export function colorCatBreed(id: ColorCatBreedId) {
  return Object.hasOwn(colorCatBreeds, id) ? colorCatBreeds[id] : undefined;
}
