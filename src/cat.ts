import { irisColors, nameLength, options, readConfig, type Config } from './model';
import { catAccessoryOptions, catAssetOptions, catExtraEyes, orangeAccessoryOptions, retiredForeheadDesigns, retiredMouthStyles, retiredNoseStyles, retiredTailStyles } from './pet-assets';
import { colorCatBreed, colorCatBreeds, type CatArtPalette, type CatFurColors, type ColorCatBreedId } from './cat-breeds';

export const catIrisColors = {
  ...irisColors,
  violet: '#896AB2',
  rose: '#B96382',
  gray: '#8D98A4',
} as const;

export type CatIrisColor = keyof typeof catIrisColors;

const catPupilColors = {
  natural: '原色', amber: '琥珀色', blue: '蓝色', green: '绿色',
  violet: '紫色', rose: '玫瑰色', gray: '灰色',
} as const satisfies Record<CatIrisColor | 'natural', string>;

export const catFeatureColors = {
  natural: { name: '品种原色' },
  lightPink: { name: '浅粉', color: '#EAA9B2' },
  rose: { name: '玫瑰粉', color: '#D77792' },
  coral: { name: '珊瑚粉', color: '#E98E7B' },
  cocoa: { name: '可可棕', color: '#96685E' },
  charcoal: { name: '炭灰', color: '#55505B' },
  plum: { name: '梅子紫', color: '#A779A7' },
} as const;
type CatFeatureColor = keyof typeof catFeatureColors;
const featureColorOptions = Object.fromEntries(Object.entries(catFeatureColors)
  .map(([id, option]) => [id, option.name])) as Record<CatFeatureColor, string>;

// Base fur, markings, and pale fur. Shadows and highlights follow these three colors.
export const catCoatSchemes = {
  native: { name: '品种原色', colors: [] },
  honey: { name: '蜂蜜黄', colors: ['#EFC466', '#B78336', '#FFF5D9'] },
  cream: { name: '奶油杏', colors: ['#EBD4AB', '#BE956C', '#FFF8E8'] },
  cocoa: { name: '可可棕', colors: ['#B48364', '#80513F', '#F6E6D8'] },
  silver: { name: '银灰', colors: ['#B4B9C2', '#747E8F', '#F5F7FB'] },
  blue: { name: '雾蓝灰', colors: ['#8EA9BF', '#556C91', '#ECF4FA'] },
  sage: { name: '鼠尾草绿', colors: ['#A3AE88', '#667650', '#F1F3E2'] },
  seaGlass: { name: '海盐青', colors: ['#91B9B3', '#537E79', '#E8F6F2'] },
  lavender: { name: '雾紫', colors: ['#B2A1C9', '#7A668E', '#F4EDF9'] },
  rose: { name: '玫瑰豆沙', colors: ['#CB939F', '#955D72', '#FBE9ED'] },
  deepSea: { name: '深海蓝', colors: ['#627D9D', '#364863', '#E1ECF7'] },
} as const;
export type CatCoatScheme = keyof typeof catCoatSchemes;

const colorBreedEntries = Object.entries(colorCatBreeds) as [ColorCatBreedId, NonNullable<ReturnType<typeof colorCatBreed>>][];
const paletteOptions = { ...catAssetOptions.palette, ...Object.fromEntries(colorBreedEntries.map(([id, breed]) => {
  if (Object.hasOwn(catAssetOptions.palette, id)) throw Error(`品种编号已使用：${id}`);
  return [id, breed.name];
})) } as Record<CatArtPalette | ColorCatBreedId, string>;

export const catOptions = {
  ear: catAssetOptions.ear,
  earColor: featureColorOptions,
  nose: catAssetOptions.nose,
  noseColor: featureColorOptions,
  mouth: catAssetOptions.mouth,
  tail: catAssetOptions.tail,
  eye: { ...options.eye, ...catExtraEyes },
  eyeColor: catPupilColors,
  innerPupil: { none: '无', round: '圆形' },
  innerEyeColor: catPupilColors,
  pattern: catAssetOptions.pattern,
  bodyPattern: { native: '品种原纹', plain: '无毛纹', mackerel: '细虎斑', classic: '经典虎斑', spotted: '点状虎斑' },
  coat: Object.fromEntries(Object.entries(catCoatSchemes).map(([id, scheme]) => [id, scheme.name])) as Record<CatCoatScheme, string>,
  palette: paletteOptions,
  accessory: catAccessoryOptions,
} as const;

export const orangeCatOptions = {
  ...catOptions,
  accessory: orangeAccessoryOptions,
} as const;

type CatParts = {
  [Key in keyof typeof catOptions]: keyof typeof catOptions[Key] | keyof typeof orangeCatOptions[Key];
};
export type CatPupilStyle = Pick<CatParts, 'eyeColor' | 'innerPupil' | 'innerEyeColor'>;
type EyeSide = 'left' | 'right';
type CatPupilOverrides = Partial<{
  [Field in keyof CatPupilStyle as `${EyeSide}${Capitalize<Field>}`]: CatPupilStyle[Field];
}>;
export type CatConfig = Omit<CatParts, 'nose' | 'mouth' | 'tail'> & CatPupilOverrides & {
  version: 1; name: string; frame: 'CAT';
  nose: CatParts['nose'] | keyof typeof retiredNoseStyles;
  mouth: CatParts['mouth'] | keyof typeof retiredMouthStyles;
  tail: CatParts['tail'] | keyof typeof retiredTailStyles;
};
export type PetConfig = Config | CatConfig;
type BreedCoat = `breed:${ColorCatBreedId}`;
export type CatRenderCoat = CatCoatScheme | BreedCoat;
export type CatRenderConfig = Omit<CatConfig, 'palette' | 'coat'> & { palette: CatArtPalette; coat: CatRenderCoat };

export function catPupilStyle(config: CatPupilStyle & CatPupilOverrides, side: EyeSide): CatPupilStyle {
  return {
    eyeColor: config[`${side}EyeColor`] ?? config.eyeColor,
    innerPupil: config[`${side}InnerPupil`] ?? config.innerPupil,
    innerEyeColor: config[`${side}InnerEyeColor`] ?? config.innerEyeColor,
  };
}

// Base fur, markings, and pale fur from each breed's original coloring.
export const nativeCatFur = {
  CC01: ['#F1AB69', '#BB7548', '#FFFBF5'],
  CC02: ['#514B59', '#312D36', '#665F6B'],
  CC03: ['#CA976C', '#745447', '#FBF9F3'],
  CC04: ['#E9CCB0', '#916B55', '#FFF3E6'],
  CC05: ['#95999F', '#73757A', '#F8F7F4'],
  CC06: ['#C4C5C8', '#919398', '#FAF9F5'],
  CC07: ['#B97E4C', '#7B4F35', '#FFF7EB'],
  CC08: ['#FAE8CB', '#C18B60', '#FFFDF8'],
} as const satisfies Record<CatArtPalette, CatFurColors>;

const standardCat = {
  version: 1, frame: 'CAT', accessory: 'A00', ear: 'CE01', earColor: 'natural',
  nose: 'NO05', noseColor: 'natural', mouth: 'CN08', tail: 'CT05',
  eye: 'Y01', innerPupil: 'round', innerEyeColor: 'natural', coat: 'native', bodyPattern: 'native',
} as const;
const legacyNose = { CN01: 'NO01', CN02: 'NO02', CN03: 'NO03', CN04: 'NO04' } as const satisfies
  Record<keyof typeof retiredMouthStyles, CatConfig['nose']>;
const drawnCatPresets = {
  preset_cat_orange: { ...standardCat, name: '橘猫', innerPupil: 'none', eyeColor: 'natural', palette: 'CC01', pattern: 'P00' },
  preset_cat_black: { ...standardCat, name: '黑猫', eyeColor: 'natural', palette: 'CC02', pattern: 'P00' },
  preset_cat_calico: { ...standardCat, name: '三花猫', eyeColor: 'green', palette: 'CC03', pattern: 'P00' },
  preset_cat_siamese: { ...standardCat, name: '暹罗猫', eyeColor: 'blue', palette: 'CC04', pattern: 'P00' },
  preset_cat_british_blue: { ...standardCat, name: '英短蓝猫', eyeColor: 'natural', palette: 'CC05', pattern: 'P00' },
  preset_cat_american_shorthair: { ...standardCat, name: '美短', eyeColor: 'natural', palette: 'CC06', pattern: 'P00' },
  preset_cat_li_hua: { ...standardCat, name: '狸花猫', eyeColor: 'natural', palette: 'CC07', pattern: 'P00' },
  preset_cat_ragdoll: { ...standardCat, name: '布偶猫', eyeColor: 'natural', palette: 'CC08', pattern: 'P00' },
} satisfies Record<string, CatConfig>;

const defaultCatByPalette = new Map(Object.values(drawnCatPresets).map(config => [config.palette, config]));
const colorCatPresets = Object.fromEntries(colorBreedEntries.map(([id, breed]) => [
  `preset_cat_${id}`, { ...defaultCatByPalette.get(breed.template ?? 'CC01')!, name: breed.name, palette: id },
])) as Record<`preset_cat_${ColorCatBreedId}`, CatConfig>;
export const catPresets = { ...drawnCatPresets, ...colorCatPresets };

export function catRenderConfig(config: CatConfig | CatRenderConfig): CatRenderConfig {
  const breed = colorCatBreed(config.palette);
  if (!breed) return config as CatRenderConfig;
  return {
    ...config, palette: breed.template ?? 'CC01',
    coat: config.coat === 'native' ? `breed:${config.palette}` : config.coat,
  };
}

export function catCoatColors(coat: Exclude<CatRenderCoat, 'native'>): CatFurColors {
  if (coat.startsWith('breed:')) return colorCatBreed(coat.slice(6) as ColorCatBreedId)!.colors;
  return catCoatSchemes[coat as Exclude<CatCoatScheme, 'native'>].colors;
}

export function catPaletteColors(palette: CatConfig['palette']): CatFurColors {
  return colorCatBreed(palette)?.colors ?? nativeCatFur[palette as CatArtPalette];
}

export function usesOrangeCatArt(config: PetConfig): boolean {
  if (config.frame !== 'CAT') return false;
  const breed = colorCatBreed(config.palette);
  return (breed ? breed.template ?? 'CC01' : config.palette) === 'CC01';
}

// Fur base, shadow, highlight, pale coat, pale coat shadow.
export const blackCatCoat = ['#3B3941', '#2B2930', '#625D67', '#45424D', '#342F39'] as const;

const sidePupilChoices = {
  EyeColor: catOptions.eyeColor,
  InnerPupil: catOptions.innerPupil,
  InnerEyeColor: catOptions.innerEyeColor,
} as const;

export function readPetConfig(input: unknown, { preserveLegacyNose = false, preserveLegacyMouth = false, preserveLegacyTail = false } = {}): PetConfig {
  if (typeof input !== 'object' || input === null || !('frame' in input) || input.frame !== 'CAT') {
    return readConfig(input);
  }
  const data = input as Record<string, unknown>;
  if (data.version !== 1) throw Error('猫配置版本无效');
  if (typeof data.name !== 'string' || nameLength(data.name) < 1 || nameLength(data.name) > 8) {
    throw Error('name 须为 1–8 字');
  }
  const orange = data.palette === 'CC01';
  const catalog = orange ? orangeCatOptions : catOptions;
  const colorBreed = typeof data.palette === 'string' ? colorCatBreed(data.palette as ColorCatBreedId) : undefined;
  const defaultsToSinglePupil = orange || (colorBreed && (colorBreed.template ?? 'CC01') === 'CC01');
  let accessory = data.accessory ?? 'A00';
  // A06 identified the typing pose on other coats and the cap on orange.
  if (accessory === 'A04' || accessory === 'A05' || (!orange && accessory === 'A06')) accessory = 'A00';
  if (orange && accessory === 'A07') accessory = 'A06';
  const choices: Record<string, unknown> = {
    ...data,
    accessory,
    earColor: data.earColor ?? 'natural',
    tail: data.tail ?? (preserveLegacyTail ? 'CT01' : 'CT05'),
    innerPupil: data.innerPupil ?? (data.pupil === 'double' ? 'round'
      : data.pupil === 'single' || defaultsToSinglePupil ? 'none' : 'round'),
    innerEyeColor: data.innerEyeColor ?? 'natural',
    eyeColor: data.eyeColor ?? 'natural',
    coat: data.coat ?? 'native',
    bodyPattern: data.bodyPattern ?? 'native',
    // A legacy muzzle selected the two matching cels.
    mouth: data.mouth ?? data.muzzle ?? (preserveLegacyMouth ? 'CN01' : standardCat.mouth),
    nose: data.nose ?? (typeof data.muzzle === 'string' && Object.hasOwn(legacyNose, data.muzzle)
      ? legacyNose[data.muzzle as keyof typeof legacyNose] : preserveLegacyNose ? 'NO01' : 'NO05'),
    noseColor: data.noseColor ?? 'natural',
  };
  if (typeof choices.pattern === 'string' && Object.hasOwn(retiredForeheadDesigns, choices.pattern)) {
    choices.pattern = retiredForeheadDesigns[choices.pattern as keyof typeof retiredForeheadDesigns];
  }
  const retiredNose = typeof choices.nose === 'string' && Object.hasOwn(retiredNoseStyles, choices.nose);
  if (retiredNose && !preserveLegacyNose) choices.nose = retiredNoseStyles[choices.nose as keyof typeof retiredNoseStyles];
  const retiredMouth = typeof choices.mouth === 'string' && Object.hasOwn(retiredMouthStyles, choices.mouth);
  if (retiredMouth && !preserveLegacyMouth) choices.mouth = retiredMouthStyles[choices.mouth as keyof typeof retiredMouthStyles];
  const retiredTail = typeof choices.tail === 'string' && Object.hasOwn(retiredTailStyles, choices.tail);
  if (retiredTail && !preserveLegacyTail) choices.tail = retiredTailStyles[choices.tail as keyof typeof retiredTailStyles];
  for (const [field, values] of Object.entries(catalog)) {
    if (field === 'nose' && retiredNose && preserveLegacyNose) continue;
    if (field === 'mouth' && retiredMouth && preserveLegacyMouth) continue;
    if (field === 'tail' && retiredTail && preserveLegacyTail) continue;
    const value = choices[field];
    if (typeof value !== 'string' || !Object.hasOwn(values, value)) throw Error(`${field} 缺失或编号无效`);
  }
  const pupilOverrides: Record<string, string> = {};
  for (const side of ['left', 'right']) {
    for (const [suffix, values] of Object.entries(sidePupilChoices)) {
      const field = side + suffix;
      const value = data[field];
      if (value === undefined) continue;
      if (typeof value !== 'string' || !Object.hasOwn(values, value)) throw Error(`${field} 编号无效`);
      pupilOverrides[field] = value;
    }
  }
  return {
    ...Object.fromEntries(Object.keys(catalog).map(field => [field, choices[field]])),
    ...pupilOverrides,
    version: 1, name: data.name.trim(), frame: 'CAT',
  } as CatConfig;
}
