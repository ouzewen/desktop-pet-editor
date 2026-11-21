import { catPhotoEarSides, catPhotoParts, type CatPhotoEarSide } from './pet-assets';
import { catPhotoEarPigments, type CatPhotoEarPigment } from './cat-photo-request';

export type CatPhotoPartId = keyof typeof catPhotoParts;
type CatPhotoPartSlot = typeof catPhotoParts[CatPhotoPartId]['slot'];

export function readCatPhotoParts(value: unknown, palette: unknown): CatPhotoPartId[] {
  if (!Array.isArray(value)) return [];
  const result: CatPhotoPartId[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !Object.hasOwn(catPhotoParts, id)) continue;
    const part = catPhotoParts[id as CatPhotoPartId];
    if ((part.palette === 'any' || part.palette === palette) && !result.some(other => catPhotoParts[other].slot === part.slot)) {
      result.push(id as CatPhotoPartId);
    }
  }
  return result;
}

export function catPhotoPartFor(
  parts: readonly CatPhotoPartId[] | undefined, slot: CatPhotoPartSlot, palette: string, coat: string,
) {
  return parts?.find(id => {
    const part = catPhotoParts[id];
    return part.slot === slot && (part.palette === 'any'
      || part.palette === palette && ('coat' in part ? part.coat : 'native') === coat);
  });
}

export type CatPhotoEarColors = Partial<Record<CatPhotoEarSide, CatPhotoEarPigment>>;

export function isCatPhotoEarPigment(value: unknown): value is CatPhotoEarPigment {
  return typeof value === 'string' && (catPhotoEarPigments as readonly string[]).includes(value);
}

export function readCatPhotoEarColors(value: unknown, parts: readonly CatPhotoPartId[]) {
  const colors: CatPhotoEarColors = {};
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  for (const side of catPhotoEarSides) {
    const pigment = data[side];
    if (isCatPhotoEarPigment(pigment) && parts.some(id => catPhotoParts[id].slot === `ear-${side}`)) colors[side] = pigment;
  }
  return colors;
}
