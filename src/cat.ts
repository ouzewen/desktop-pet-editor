import { nameLength, options, readConfig, type Config } from './model';

export const catOptions = {
  ear: { CE01: '三角立耳', CE02: '折耳', CE03: '圆耳', CE04: '垂耳' },
  muzzle: { CN01: '小圆嘴', CN02: '吐舌', CN03: '张嘴喵', CN04: '扁嘴' },
  tail: { CT01: '细长尾' },
  eye: { ...options.eye, Y05: '大圆眼', Y06: '半闭眼', Y07: '星星眼' },
  eyeColor: options.eyeColor,
  pattern: { P00: '无面部花纹', P02: '眉斑与浅颊', P01: '额线', P06: '眉斑 + 额线' },
  palette: { CC01: '橘白', CC02: '纯黑', CC03: '三花' },
} as const;

type CatParts = { [Key in keyof typeof catOptions]: keyof typeof catOptions[Key] };
export type CatConfig = CatParts & { version: 1; name: string; frame: 'CAT'; accessory: null };
export type PetConfig = Config | CatConfig;

const standardCat = {
  version: 1, frame: 'CAT', accessory: null, ear: 'CE01', muzzle: 'CN01', tail: 'CT01', eye: 'Y01',
} as const;
export const catPresets = {
  preset_cat_orange: { ...standardCat, name: '橘猫', eyeColor: 'amber', palette: 'CC01', pattern: 'P00' },
  preset_cat_black: { ...standardCat, name: '黑猫', eyeColor: 'natural', palette: 'CC02', pattern: 'P00' },
  preset_cat_calico: { ...standardCat, name: '三花猫', eyeColor: 'green', palette: 'CC03', pattern: 'P00' },
} satisfies Record<string, CatConfig>;

// Fur base, shadow, highlight, pale coat, pale coat shadow.
export const blackCatCoat = ['#3B3941', '#2B2930', '#625D67', '#45424D', '#342F39'] as const;

export const catWalkFrames = 4;

export function readPetConfig(input: unknown): PetConfig {
  if (typeof input !== 'object' || input === null || !('frame' in input) || input.frame !== 'CAT') {
    return readConfig(input);
  }
  const data = input as Record<string, unknown>;
  if (data.version !== 1 || data.accessory !== null) throw Error('猫配置版本或配饰编号无效');
  if (typeof data.name !== 'string' || nameLength(data.name) < 1 || nameLength(data.name) > 8) {
    throw Error('name 须为 1–8 字');
  }
  const choices: Record<string, unknown> = { ...data, eyeColor: data.eyeColor ?? 'natural' };
  for (const [field, values] of Object.entries(catOptions)) {
    const value = choices[field];
    if (typeof value !== 'string' || !Object.hasOwn(values, value)) throw Error(`${field} 缺失或编号无效`);
  }
  return {
    ...Object.fromEntries(Object.keys(catOptions).map(field => [field, choices[field]])),
    version: 1, name: data.name.trim(), frame: 'CAT', accessory: null,
  } as CatConfig;
}
