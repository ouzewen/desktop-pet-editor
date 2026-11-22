import { readCatPhotoEarColors, readCatPhotoParts, type CatPhotoEarColors, type CatPhotoPartId } from './cat-photo-parts';
import { readFurPatches, type FurPatch } from './cat-fur-patches';
import { irisColors, nameLength, options, readConfig, type Config } from './model';
import { calicoCrownLayouts, catAccessoryOptions, catAssetOptions, catExtraEyes, orangeAccessoryOptions, retiredForeheadDesigns, retiredMouthStyles, retiredNoseStyles, retiredTailStyles } from './pet-assets';
import { colorCatBreed, colorCatBreeds, type CatArtPalette, type CatFurColors, type ColorCatBreedId } from './cat-breeds';

export const catIrisColors = {
  ...irisColors,
  violet: '#896AB2',
  rose: '#B96382',
  gray: '#8D98A4',
  honeyGold: '#D9A64C',
  copper: '#BB673F',
  cocoa: '#704838',
  olive: '#627247',
  mint: '#67B39B',
  teal: '#378E90',
  iceBlue: '#91C4E2',
  sapphire: '#3F59A4',
  lavender: '#B299D3',
  paleGold: '#E7CE86',
  gold: '#D6A93F',
  hazel: '#9E7B3F',
  bronze: '#8E5B33',
  orange: '#D9822B',
  emerald: '#3F8B5C',
  forest: '#4C6B3F',
  paleGreen: '#A9C98A',
  aqua: '#57B2B0',
  skyBlue: '#7EB8E0',
  steelBlue: '#5C7E9C',
  paleBlue: '#A9CBE8',
  pearl: '#DCD4C6',
} as const;

export type CatIrisColor = keyof typeof catIrisColors;

const catPupilColors = {
  natural: '原色', amber: '琥珀色', honeyGold: '蜂蜜金', copper: '赤铜色',
  cocoa: '可可棕', olive: '橄榄绿', green: '绿色', mint: '薄荷绿',
  teal: '湖水青', iceBlue: '冰蓝色', blue: '蓝色', sapphire: '宝石蓝',
  gray: '灰色', lavender: '雾紫', violet: '紫色', rose: '玫瑰色',
  paleGold: '淡金色', gold: '金色', hazel: '榛色', bronze: '古铜色',
  orange: '橙色', emerald: '祖母绿', forest: '森林绿', paleGreen: '浅绿色',
  aqua: '水青色', skyBlue: '天蓝色', steelBlue: '钢蓝色', paleBlue: '淡蓝色',
  pearl: '珍珠色',
} as const satisfies Record<CatIrisColor | 'natural', string>;

export const catFeatureColors = {
  natural: { name: '品种原色' },
  lightPink: { name: '浅粉', color: '#EAA9B2' },
  palePink: { name: '淡粉', color: '#F4C9CE' },
  rose: { name: '玫瑰粉', color: '#D77792' },
  coral: { name: '珊瑚粉', color: '#E98E7B' },
  salmon: { name: '鲑鱼粉', color: '#E08E80' },
  peach: { name: '蜜桃', color: '#EFB28D' },
  brick: { name: '砖红', color: '#B45F4E' },
  cream: { name: '奶油', color: '#EFE0C9' },
  beige: { name: '米杏', color: '#D9BD9F' },
  cocoa: { name: '可可棕', color: '#96685E' },
  brown: { name: '棕褐', color: '#8A5C43' },
  chocolate: { name: '巧克力', color: '#644235' },
  charcoal: { name: '炭灰', color: '#55505B' },
  gray: { name: '灰色', color: '#9B9C9F' },
  blueGray: { name: '蓝灰', color: '#7C8C9C' },
  lilac: { name: '丁香紫', color: '#B7A6C6' },
  plum: { name: '梅子紫', color: '#A779A7' },
  white: { name: '雪白', color: '#F7F2E9' },
  black: { name: '墨黑', color: '#3A3338' },
} as const;
type CatFeatureColor = keyof typeof catFeatureColors;
const featureColorOptions = Object.fromEntries(Object.entries(catFeatureColors)
  .map(([id, option]) => [id, option.name])) as Record<CatFeatureColor, string>;

// Four painted shades, from the ear cushion shadow to the shell highlight.
export const catHeadphoneColors = {
  natural: { name: '原版蓝', shades: ['#395D87', '#4B79AA', '#719DCF', '#A0C4E2'] },
  cream: { name: '奶油白', shades: ['#947C63', '#BEA78C', '#E8D8BE', '#FFF1DB'] },
  charcoal: { name: '炭灰', shades: ['#292833', '#444350', '#666674', '#9394A1'] },
  pink: { name: '樱花粉', shades: ['#83455D', '#AF637D', '#D98FA6', '#F7BDC9'] },
  mint: { name: '薄荷绿', shades: ['#37665B', '#4C8F7D', '#77B9A7', '#B1DAC9'] },
  lavender: { name: '雾紫', shades: ['#5B4B7C', '#7E69A4', '#A793C8', '#CDBDE5'] },
} as const;
type CatHeadphoneColor = keyof typeof catHeadphoneColors;
const headphoneColorOptions = Object.fromEntries(Object.entries(catHeadphoneColors)
  .map(([id, option]) => [id, option.name])) as Record<CatHeadphoneColor, string>;

const colorBreedEntries = Object.entries(colorCatBreeds) as [ColorCatBreedId, NonNullable<ReturnType<typeof colorCatBreed>>][];
const paletteOptions = { ...catAssetOptions.palette, ...Object.fromEntries(colorBreedEntries.map(([id, breed]) => {
  if (Object.hasOwn(catAssetOptions.palette, id)) throw Error(`品种编号已使用：${id}`);
  return [id, breed.name];
})) } as Record<CatArtPalette | ColorCatBreedId, string>;

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
  version: 1, frame: 'CAT', accessory: 'A00', headphoneColor: 'natural', ear: 'CE01', earColor: 'natural',
  nose: 'NO05', noseColor: 'natural', mouth: 'CN08', tail: 'CT05',
  eye: 'Y01', innerPupil: 'round', innerEyeColor: 'natural', coat: 'native', bodyPattern: 'native',
} as const;
// The workbench catalog lists the built-in presets in this order.
const drawnCatPresets = {
  preset_cat_orange: { ...standardCat, name: '橘猫', innerPupil: 'none', eyeColor: 'natural', palette: 'CC01', pattern: 'P00' },
  preset_cat_black: {
    ...standardCat, name: '黑猫', eyeColor: 'natural', palette: 'CC02', coat: 'jetBlack', pattern: 'P03', mouthContrast: 'light',
  },
  preset_cat_british_blue: { ...standardCat, name: '英短蓝猫', eyeColor: 'natural', palette: 'CC05', pattern: 'P00' },
  preset_cat_american_shorthair: { ...standardCat, name: '美短', eyeColor: 'natural', palette: 'CC06', pattern: 'P00' },
  preset_cat_li_hua: { ...standardCat, name: '狸花猫', eyeColor: 'natural', palette: 'CC07', pattern: 'P00' },
  preset_cat_calico: { ...standardCat, name: '三花猫', eyeColor: 'green', palette: 'CC03', pattern: 'P00' },
  preset_cat_siamese: { ...standardCat, name: '暹罗猫', eyeColor: 'blue', palette: 'CC04', pattern: 'P00' },
  preset_cat_ragdoll: { ...standardCat, name: '布偶猫', eyeColor: 'natural', palette: 'CC08', pattern: 'P00' },
} as const;

type BreedCoat = `breed:${ColorCatBreedId}`;
const breedCoatSchemes = Object.fromEntries([
  ...Object.values(drawnCatPresets),
  ...colorBreedEntries.map(([palette, breed]) => ({ palette, name: breed.name })),
].map(({ palette, name }) => [`breed:${palette}`, { name: `${name}配色`, colors: catPaletteColors(palette) }])) as Record<BreedCoat, { name: string; colors: CatFurColors }>;

// These coats have cards on their own breed. The general palette remains
// available as swatches for more unusual combinations.
const breedCoatVariants = {
  orangeHoney: { palette: 'CC01', name: '蜜橘', colors: ['#F6BD73', '#CF8A50', '#FFF7E8'] },
  orangeCream: { palette: 'CC01', name: '奶油橘', colors: ['#F1D5AF', '#D8A87D', '#FFF9F0'] },
  blackSmoke: { palette: 'CC02', name: '烟黑', colors: ['#43434F', '#262631', '#5C5967'] },
  blackWarm: { palette: 'CC02', name: '暖炭黑', colors: ['#41342F', '#291E1D', '#5B4740'] },
  calicoApricot: { palette: 'CC03', name: '杏橘三花', colors: ['#EDBD91', '#77616B', '#FCF3E5'] },
  calicoCinnamon: { palette: 'CC03', name: '肉桂三花', colors: ['#DC9560', '#935740', '#FFF1DD'] },
  siameseWarm: { palette: 'CC04', name: '暖棕重点', colors: ['#ECC7A2', '#9B5F40', '#FFF0D9'] },
  siameseCool: { palette: 'CC04', name: '冷灰重点', colors: ['#C0BDC4', '#625D72', '#FAF3ED'] },
  britishLilac: { palette: 'CC05', name: '丁香灰', colors: ['#B8A6AD', '#81727D', '#F1E5E8'] },
  britishSlate: { palette: 'CC05', name: '深蓝灰', colors: ['#738496', '#4C5C71', '#CDD7E2'] },
  americanSilver: { palette: 'CC06', name: '银虎斑', colors: ['#D2DAE1', '#687282', '#F8FBFF'] },
  americanBrown: { palette: 'CC06', name: '棕虎斑', colors: ['#C9976A', '#6F4C37', '#FCF4E7'] },
  liHuaGold: { palette: 'CC07', name: '金棕狸花', colors: ['#D6A563', '#85532E', '#FAE9CA'] },
  liHuaAsh: { palette: 'CC07', name: '灰褐狸花', colors: ['#A89D8E', '#5B534B', '#EEE5D6'] },
  ragdollBlue: { palette: 'CC08', name: '蓝灰重点', colors: ['#E4DFE5', '#8990A8', '#FFFBFE'] },
  ragdollChocolate: { palette: 'CC08', name: '巧克力重点', colors: ['#F4D7B6', '#A67766', '#FFF6E9'] },
  whiteSnow: { palette: 'CC09', name: '冰雪白', colors: ['#E9F2FB', '#A8B5C9', '#FFFFFF'] },
  whiteCream: { palette: 'CC09', name: '暖绒白', colors: ['#FCF0DC', '#CDBAA8', '#FFFDF6'] },
  tortieAmber: { palette: 'CC10', name: '琥珀玳瑁', colors: ['#EAA258', '#382A35', '#5A444E'] },
  tortieWalnut: { palette: 'CC10', name: '胡桃玳瑁', colors: ['#B37355', '#514039', '#684D40'] },
  goldenApricot: { palette: 'CC11', name: '杏蜜金', colors: ['#F4CE97', '#AC7350', '#FFF3D9'] },
  goldenCaramel: { palette: 'CC11', name: '焦糖金', colors: ['#D49E60', '#835137', '#FFDEAA'] },
  diluteMist: { palette: 'CC12', name: '雾蓝淡三花', colors: ['#DDBAA6', '#778BAB', '#F8F6F2'] },
  dilutePeach: { palette: 'CC12', name: '蜜桃淡三花', colors: ['#F4B998', '#ABA0B0', '#FFF2E6'] },
} as const satisfies Record<string, { palette: CatArtPalette | ColorCatBreedId; name: string; colors: CatFurColors }>;

// Base fur, markings, and pale fur. Shadows and highlights follow these three colors.
export const catCoatSchemes = Object.assign({ native: { name: '品种原色', colors: [] } } as const, breedCoatSchemes, {
  jetBlack: { name: '纯黑', colors: ['#1A191B', '#121113', '#333236'] },
  ivory: { name: '象牙白', colors: ['#F0EAE5', '#D6CEC8', '#FFFDF8'] },
  honey: { name: '蜂蜜黄', colors: ['#EFC466', '#B78336', '#FFF5D9'] },
  cream: { name: '奶油杏', colors: ['#EBD4AB', '#BE956C', '#FFF8E8'] },
  cocoa: { name: '可可棕', colors: ['#B48364', '#80513F', '#F6E6D8'] },
  darkTabby: { name: '深灰褐虎斑', colors: ['#61584E', '#37332F', '#8E8171'] },
  silver: { name: '银灰', colors: ['#B4B9C2', '#747E8F', '#F5F7FB'] },
  blue: { name: '雾蓝灰', colors: ['#8EA9BF', '#556C91', '#ECF4FA'] },
  sage: { name: '鼠尾草绿', colors: ['#A3AE88', '#667650', '#F1F3E2'] },
  seaGlass: { name: '海盐青', colors: ['#91B9B3', '#537E79', '#E8F6F2'] },
  lavender: { name: '雾紫', colors: ['#B2A1C9', '#7A668E', '#F4EDF9'] },
  rose: { name: '玫瑰豆沙', colors: ['#CB939F', '#955D72', '#FBE9ED'] },
  deepSea: { name: '深海蓝', colors: ['#627D9D', '#364863', '#E1ECF7'] },
} as const, breedCoatVariants);
export type CatCoatScheme = keyof typeof catCoatSchemes;

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
  headphoneColor: headphoneColorOptions,
} as const;

export const orangeCatOptions = {
  ...catOptions,
  accessory: orangeAccessoryOptions,
} as const;

const localMarkings = { native: '品种原纹', plain: '无', mackerel: '细虎斑', classic: '经典虎斑', spotted: '点状虎斑' } as const;
export const catMarkingOptions = {
  faceBase: { native: '品种原底', solid: '均匀底色' },
  cheekPattern: localMarkings,
  forelegPatternSource: { native: '沿用身体纹', separate: '只用独立前肢纹' },
  bodyBase: { native: '品种原底', solid: '纯色身体' },
  tailPattern: { ...localMarkings, plain: '纯色', mackerel: '细尾环', classic: '宽尾环' },
} as const;

type LocalCatMarkings = Partial<{ [Key in keyof typeof catMarkingOptions]: keyof typeof catMarkingOptions[Key] }>;

type CatParts = {
  [Key in keyof typeof catOptions]: keyof typeof catOptions[Key] | keyof typeof orangeCatOptions[Key];
};
export type CatPupilStyle = Pick<CatParts, 'eyeColor' | 'innerPupil' | 'innerEyeColor'>;
type EyeSide = 'left' | 'right';
type CatPupilOverrides = Partial<{
  [Field in keyof CatPupilStyle as `${EyeSide}${Capitalize<Field>}`]: CatPupilStyle[Field];
}>;
export type CatEar = CatParts['ear'];
export type CatConfig = Omit<CatParts, 'nose' | 'mouth' | 'tail'> & CatPupilOverrides & LocalCatMarkings & {
  version: 1; name: string; frame: 'CAT'; furPatches?: FurPatch[];
  photoCoatParts?: CatPhotoPartId[];
  photoEarColors?: CatPhotoEarColors;
  leftEar?: CatEar; rightEar?: CatEar;
  eyeRim?: 'none'; mouthContrast?: 'light';
  calicoCrown?: 'orange-left' | 'orange-right';
  calicoCrownLayout?: typeof calicoCrownLayouts[number];
  calicoCrownTop?: 'split' | 'dark' | 'high-cap';
  calicoFaceFinish?: 'h3r3';
  whiteDistribution?: 'bib' | 'shoulder' | 'head-tail';
  coloredTail?: 'dark' | 'orange' | 'gray';
  nose: CatParts['nose'] | keyof typeof retiredNoseStyles;
  mouth: CatParts['mouth'] | keyof typeof retiredMouthStyles;
  tail: CatParts['tail'] | keyof typeof retiredTailStyles;
};
export function catEarOnSide(config: Pick<CatConfig, 'ear' | 'leftEar' | 'rightEar'>, side: 'left' | 'right') {
  return (side === 'left' ? config.leftEar : config.rightEar) ?? config.ear;
}

export type PetConfig = Config | CatConfig;
export const currentFurPatternColors = 'clean-white-fur' as const;
export type FurPatternColors = typeof currentFurPatternColors | 'clean-honey-gold' | 'honey-gold' | 'independent-fur' | 'connected-chest' | 'clean-face' | 'breed-pigment' | 'calico-chest' | 'matched' | 'original';
export type CatRenderConfig = Omit<CatConfig, 'palette' | 'coat'> & {
  palette: CatArtPalette; coat: CatCoatScheme; furPatternColors?: FurPatternColors;
};

export function hasIndependentFur(version: FurPatternColors = currentFurPatternColors) {
  return version === currentFurPatternColors || version === 'clean-honey-gold' || version === 'honey-gold' || version === 'independent-fur';
}

export function hasHoneyGoldFur(config: CatRenderConfig) {
  const version = config.furPatternColors ?? currentFurPatternColors;
  return config.palette === 'CC02'
    && (config.coat === 'breed:CC11' || config.coat === 'goldenApricot' || config.coat === 'goldenCaramel')
    && (version === currentFurPatternColors || version === 'clean-honey-gold' || version === 'honey-gold');
}

export function usesWhiteCatCoat({ palette, coat }: CatRenderConfig) {
  return palette === 'CC02' && (coat === 'breed:CC09' || coat === 'whiteSnow' || coat === 'whiteCream');
}

export function catPupilStyle(config: CatPupilStyle & CatPupilOverrides, side: EyeSide): CatPupilStyle {
  return {
    eyeColor: config[`${side}EyeColor`] ?? config.eyeColor,
    innerPupil: config[`${side}InnerPupil`] ?? config.innerPupil,
    innerEyeColor: config[`${side}InnerEyeColor`] ?? config.innerEyeColor,
  };
}

const localMarkingDefaults = {
  faceBase: 'native', cheekPattern: 'native', bodyBase: 'native', tailPattern: 'native', forelegPatternSource: 'native',
} as const satisfies LocalCatMarkings;
const legacyNose = { CN01: 'NO01', CN02: 'NO02', CN03: 'NO03', CN04: 'NO04' } as const satisfies
  Record<keyof typeof retiredMouthStyles, CatConfig['nose']>;
const defaultCatByPalette = new Map(Object.values(drawnCatPresets).map(config => [config.palette, config]));
const colorCatPresets = Object.fromEntries(colorBreedEntries.map(([id, breed]) => [
  `preset_cat_${id}`, {
    ...defaultCatByPalette.get(breed.template ?? 'CC01')!, ...breed.appearance,
    name: breed.name, palette: id, coat: 'native',
  },
])) as Record<`preset_cat_${ColorCatBreedId}`, CatConfig>;
export const legacyCatPresets = { ...drawnCatPresets, ...colorCatPresets } satisfies Record<string, CatConfig>;
export const catPresets = import.meta.env.VITE_PET_PIXEL80_KEYS ? {
  ...legacyCatPresets,
  ...Object.fromEntries(Object.entries(legacyCatPresets).map(([id, config]) => [
    id, { ...config, innerPupil: 'none' },
  ])),
} : legacyCatPresets;

export const catCoatCards = Object.fromEntries(Object.values(catPresets).map(({ palette, coat }) => [palette, [
  { id: coat, name: '品种原色' },
  ...Object.entries(breedCoatVariants).filter(([, variant]) => variant.palette === palette)
    .map(([id, { name }]) => ({ id: id as keyof typeof breedCoatVariants, name })),
]]));

export function supportsCalicoFaceFinish(config: Pick<CatConfig, 'palette' | 'coat' | 'calicoCrown' | 'calicoCrownTop' | 'calicoCrownLayout' | 'faceBase'>) {
  return config.palette === 'CC03' && config.coat === 'native' && config.faceBase === 'native'
    && config.calicoCrown === 'orange-left' && config.calicoCrownTop === 'dark' && config.calicoCrownLayout === 'eye-mask';
}

export function catRenderConfig(config: CatConfig | CatRenderConfig, furPatternColors?: FurPatternColors): CatRenderConfig {
  const breed = colorCatBreed(config.palette);
  const palette = (breed ? breed.template ?? 'CC01' : config.palette) as CatArtPalette;
  const selectedCoat: CatCoatScheme = breed && config.coat === 'native' ? `breed:${config.palette}` : config.coat;
  // Picking the artwork's own scheme uses its original pixels exactly.
  const coat = selectedCoat === `breed:${palette}` ? 'native' : selectedCoat;
  const appearance = palette === config.palette && coat === config.coat
    ? config as CatRenderConfig : { ...config, palette, coat };
  return furPatternColors ? { ...appearance, furPatternColors } : appearance;
}

export function catCoatColors(coat: Exclude<CatCoatScheme, 'native'>): CatFurColors {
  return catCoatSchemes[coat].colors;
}

// Use the main fur and marking tones from the original front cels. Calico uses
// its orange patch's shadow, and the point coats use a brown from the mask.
const matchedCatPatternFur = {
  CC01: ['#F3AE6D', '#D07846', nativeCatFur.CC01[2]],
  CC02: ['#4D4855', '#433F4A', nativeCatFur.CC02[2]],
  CC03: ['#F2A45F', '#D6723C', nativeCatFur.CC03[2]],
  CC04: ['#FDF3E1', '#946C51', nativeCatFur.CC04[2]],
  CC05: [nativeCatFur.CC05[0], '#707376', nativeCatFur.CC05[2]],
  CC06: [nativeCatFur.CC06[0], '#8E9094', nativeCatFur.CC06[2]],
  CC07: nativeCatFur.CC07,
  CC08: [nativeCatFur.CC08[0], '#C79165', nativeCatFur.CC08[2]],
} as const satisfies Record<CatArtPalette, CatFurColors>;

export function catPatternFurColors(config: CatRenderConfig): CatFurColors {
  if (config.coat !== 'native') return catCoatColors(config.coat);
  const colors = config.furPatternColors === 'original' ? nativeCatFur : matchedCatPatternFur;
  return colors[config.palette];
}

function hasBreedPigment(palette: unknown): boolean {
  return palette === 'CC03' || palette === 'CC04' || palette === 'CC08';
}

export function canChooseCatFaceBase(palette: CatConfig['palette']): boolean {
  const breed = colorCatBreed(palette);
  return hasBreedPigment(breed ? breed.template ?? 'CC01' : palette);
}

export function catKeepsBreedPigment({ palette, furPatternColors }: CatRenderConfig): boolean {
  return furPatternColors !== 'matched' && furPatternColors !== 'original' && hasBreedPigment(palette);
}

export function hasShortCalicoChest(config: CatRenderConfig): boolean {
  // The hosted preview with the short chest can still be used as the base
  // for extracting brushwork from older flattened custom images.
  return config.furPatternColors === 'calico-chest'
    && config.palette === 'CC03' && config.faceBase === 'native' && config.bodyBase === 'solid';
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

export function readPetConfig(input: unknown, {
  preserveLegacyNose = false, preserveLegacyMouth = false, preserveLegacyTail = false, preserveLinkedMarkings = false,
} = {}): PetConfig {
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
    headphoneColor: data.headphoneColor ?? 'natural',
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
  const markings: Record<string, string> = {};
  for (const [field, options] of Object.entries(catMarkingOptions)) {
    const inheritsPattern = field === 'cheekPattern' || field === 'tailPattern';
    // A linked "plain" pattern still retained calico and point tail fur.
    const nativeTail = field === 'tailPattern' && hasBreedPigment(colorBreed?.template ?? data.palette) && choices.bodyPattern === 'plain';
    const fallback = inheritsPattern && !nativeTail ? choices.bodyPattern : localMarkingDefaults[field as keyof LocalCatMarkings];
    const value = data[field] ?? (preserveLinkedMarkings ? undefined : fallback);
    if (value === undefined) continue;
    if (typeof value !== 'string' || !Object.hasOwn(options, value)) throw Error(`${field} 编号无效`);
    markings[field] = field === 'faceBase' && !preserveLinkedMarkings && !hasBreedPigment(colorBreed?.template ?? data.palette)
      ? 'native' : value;
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
  const earOverrides: Partial<Pick<CatConfig, 'leftEar' | 'rightEar'>> = {};
  for (const field of ['leftEar', 'rightEar'] as const) {
    const value = data[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !Object.hasOwn(catalog.ear, value)) throw Error(`${field} 编号无效`);
    earOverrides[field] = value as CatEar;
  }
  const furPatches = readFurPatches(data.furPatches);
  const photoCoatParts = readCatPhotoParts(data.photoCoatParts, data.palette);
  const photoEarColors = readCatPhotoEarColors(data.photoEarColors, photoCoatParts);
  return {
    ...(furPatches.length ? { furPatches } : {}),
    ...(photoCoatParts.length ? { photoCoatParts } : {}),
    ...(Object.keys(photoEarColors).length ? { photoEarColors } : {}),
    // Migrate the pre-review independent ID to the fixed face style revision.
    ...(data.palette === 'CC03' && (data.calicoFaceFinish === 'h3r3'
      || (Array.isArray(data.photoCoatParts) && data.photoCoatParts.includes('calico-orange-left-face')))
      ? { calicoFaceFinish: 'h3r3' } : {}),
    ...(data.palette === 'CC03' && (data.calicoCrown === 'orange-left' || data.calicoCrown === 'orange-right')
      ? { calicoCrown: data.calicoCrown, ...((calicoCrownLayouts as readonly unknown[]).includes(data.calicoCrownLayout)
        ? { calicoCrownLayout: data.calicoCrownLayout } : {}) } : {}),
    ...(data.palette === 'CC03' && (data.calicoCrown === 'orange-left' || data.calicoCrown === 'orange-right')
      && (data.calicoCrownTop === 'split' || data.calicoCrownTop === 'dark' || data.calicoCrownTop === 'high-cap')
      ? { calicoCrownTop: data.calicoCrownTop } : {}),
    ...(data.whiteDistribution === 'bib' || data.whiteDistribution === 'shoulder' || data.whiteDistribution === 'head-tail'
      ? { whiteDistribution: data.whiteDistribution } : {}),
    ...(data.whiteDistribution === 'head-tail' && (data.coloredTail === 'dark' || data.coloredTail === 'orange' || data.coloredTail === 'gray')
      ? { coloredTail: data.coloredTail } : {}),
    ...(data.eyeRim === 'none' ? { eyeRim: 'none' } : {}),
    ...(data.mouthContrast === 'light' ? { mouthContrast: 'light' } : {}),
    ...Object.fromEntries(Object.keys(catalog).map(field => [field, choices[field]])),
    ...markings,
    ...pupilOverrides,
    ...earOverrides,
    version: 1, name: data.name.trim(), frame: 'CAT',
  } as CatConfig;
}
