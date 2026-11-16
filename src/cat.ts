import { irisColors, nameLength, options, readConfig, type Config } from './model';

const sharedCatAccessories = {
  A00: '无配饰', A01: '红蝴蝶结', A02: '蓝色小鱼帽', A03: '黄色星星发卡',
} as const;

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

export const catOptions = {
  ear: { CE01: '三角立耳', CE02: '折耳', CE03: '圆耳', CE04: '垂耳', CE05: '卷耳' },
  nose: { NO01: '原款方鼻', NO02: '圆角鼻', NO03: '短尖鼻', NO04: '三角鼻' },
  mouth: { CN01: '小圆嘴', CN02: '吐舌', CN03: '张嘴喵', CN04: '扁嘴' },
  tail: { CT01: '细长尾', CT02: '短尾', CT03: '蓬松尾', CT04: '弯钩尾' },
  eye: { ...options.eye, Y05: '大圆眼', Y06: '半闭眼', Y07: '星星眼' },
  eyeColor: catPupilColors,
  innerPupil: { none: '无', round: '圆形' },
  innerEyeColor: catPupilColors,
  pattern: { P00: '品种原额纹', P03: '无额纹', P01: '白额线', P02: '双眉斑', P04: 'M 字纹', P05: '小菱纹', P06: '眉斑 + 额线' },
  bodyPattern: { native: '品种原纹', plain: '无毛纹', mackerel: '细虎斑', classic: '经典虎斑', spotted: '点状虎斑' },
  coat: Object.fromEntries(Object.entries(catCoatSchemes).map(([id, scheme]) => [id, scheme.name])) as Record<CatCoatScheme, string>,
  palette: {
    CC01: '橘白', CC02: '纯黑', CC03: '三花', CC04: '暹罗重点色',
    CC05: '英短蓝猫', CC06: '美短', CC07: '狸花猫', CC08: '布偶猫',
  },
  accessory: { ...sharedCatAccessories, A07: '蓝色鸭舌帽' },
} as const;

export const orangeCatOptions = {
  ...catOptions,
  accessory: { ...sharedCatAccessories, A00: '无', A06: '蓝色鸭舌帽' },
} as const;

type CatParts = {
  [Key in keyof typeof catOptions]: keyof typeof catOptions[Key] | keyof typeof orangeCatOptions[Key];
};
export type CatConfig = CatParts & { version: 1; name: string; frame: 'CAT' };
export type PetConfig = Config | CatConfig;

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
} as const satisfies Record<CatConfig['palette'], readonly [string, string, string]>;

const standardCat = {
  version: 1, frame: 'CAT', accessory: 'A00', ear: 'CE01', nose: 'NO01', mouth: 'CN01', tail: 'CT01',
  eye: 'Y01', innerPupil: 'round', innerEyeColor: 'natural', coat: 'native', bodyPattern: 'native',
} as const;
const legacyNose = { CN01: 'NO01', CN02: 'NO02', CN03: 'NO03', CN04: 'NO04' } as const satisfies
  Record<CatConfig['mouth'], CatConfig['nose']>;
export const catPresets = {
  preset_cat_orange: { ...standardCat, name: '橘猫', innerPupil: 'none', eyeColor: 'natural', palette: 'CC01', pattern: 'P00' },
  preset_cat_black: { ...standardCat, name: '黑猫', eyeColor: 'natural', palette: 'CC02', pattern: 'P00' },
  preset_cat_calico: { ...standardCat, name: '三花猫', eyeColor: 'green', palette: 'CC03', pattern: 'P00' },
  preset_cat_siamese: { ...standardCat, name: '暹罗猫', eyeColor: 'blue', palette: 'CC04', pattern: 'P00' },
  preset_cat_british_blue: { ...standardCat, name: '英短蓝猫', eyeColor: 'natural', palette: 'CC05', pattern: 'P00' },
  preset_cat_american_shorthair: { ...standardCat, name: '美短', eyeColor: 'natural', palette: 'CC06', pattern: 'P00' },
  preset_cat_li_hua: { ...standardCat, name: '狸花猫', eyeColor: 'natural', palette: 'CC07', pattern: 'P00' },
  preset_cat_ragdoll: { ...standardCat, name: '布偶猫', eyeColor: 'natural', palette: 'CC08', pattern: 'P00' },
} satisfies Record<string, CatConfig>;

export function isOrangeCat(config: PetConfig): config is CatConfig & { palette: 'CC01' } {
  return config.frame === 'CAT' && config.palette === 'CC01';
}

// Fur base, shadow, highlight, pale coat, pale coat shadow.
export const blackCatCoat = ['#3B3941', '#2B2930', '#625D67', '#45424D', '#342F39'] as const;

export const catWalkFrames = 4;

export function readPetConfig(input: unknown): PetConfig {
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
  let accessory = data.accessory ?? 'A00';
  // A06 identified the typing pose on other coats and the cap on orange.
  if (accessory === 'A04' || accessory === 'A05' || (!orange && accessory === 'A06')) accessory = 'A00';
  if (orange && accessory === 'A07') accessory = 'A06';
  const choices: Record<string, unknown> = {
    ...data,
    accessory,
    tail: data.tail ?? 'CT01',
    innerPupil: data.innerPupil ?? (data.pupil === 'double' ? 'round'
      : data.pupil === 'single' || orange ? 'none' : 'round'),
    innerEyeColor: data.innerEyeColor ?? 'natural',
    eyeColor: data.eyeColor ?? 'natural',
    coat: data.coat ?? 'native',
    bodyPattern: data.bodyPattern ?? 'native',
    // A legacy muzzle selected the two matching cels.
    mouth: data.mouth ?? data.muzzle ?? 'CN01',
    nose: data.nose ?? (typeof data.muzzle === 'string' && Object.hasOwn(legacyNose, data.muzzle)
      ? legacyNose[data.muzzle as keyof typeof legacyNose] : 'NO01'),
  };
  for (const [field, values] of Object.entries(catalog)) {
    const value = choices[field];
    if (typeof value !== 'string' || !Object.hasOwn(values, value)) throw Error(`${field} 缺失或编号无效`);
  }
  return {
    ...Object.fromEntries(Object.keys(catalog).map(field => [field, choices[field]])),
    version: 1, name: data.name.trim(), frame: 'CAT',
  } as CatConfig;
}
