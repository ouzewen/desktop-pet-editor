export const options = {
  ear: { E01: '立耳', E02: '半立耳', E03: '垂耳', E04: '长垂耳' },
  muzzle: { N01: '尖嘴', N02: '方嘴', N03: '圆嘴' },
  tail: { T01: '卷尾', T02: '长直尾' },
  eye: { Y01: '圆眼', Y02: '开心闭眼', Y03: '眯眯眼', Y04: '亮晶晶眼' },
  palette: { C01: '黄白', C02: '黑白', C03: '三色', C04: '巧克力棕', C05: '奶油白', C06: '灰白', C07: '赤棕', C08: '纯黑' },
} as const;

export type Part = keyof typeof options;
type Parts = { [Key in Part]: keyof typeof options[Key] };
export type Config = Parts & { version: 1; name: string; frame: 'M1'; pattern: 'P00'; accessory: null };

export const parts = Object.keys(options) as Part[];

export const anchors = {
  neck: [80, 52], neckHalfWidth: 15, crown: [80, 9], tail: [80, 84], floor: 142,
} as const;

export const colors = { outline: '#442416', whiteShade: '#DAD2CE', eye: '#2E2118', glint: '#FFFFFF' };

export const palettes: Record<Config['palette'], readonly [string, string, string, string, string]> = {
  C01: ['#EFB373', '#D18A4A', '#F0C49D', '#FFFFFF', '#2E2E2E'],
  C02: ['#2E2E31', '#1E1E21', '#4A4A4E', '#FFFFFF', '#1A1A1A'],
  C03: ['#2E2E31', '#1E1E21', '#996138', '#FFFFFF', '#1A1A1A'],
  C04: ['#996138', '#784C2C', '#B57A45', '#FFF6E8', '#2E2E2E'],
  C05: ['#F2D8A0', '#D9B47A', '#FBEFC0', '#FFFFFF', '#3A2A20'],
  C06: ['#8E949A', '#6B7176', '#C2C7CC', '#FFFFFF', '#2E2E2E'],
  C07: ['#C85A28', '#9E4420', '#E08A4A', '#FFF3E6', '#2E2E2E'],
  C08: ['#232326', '#141416', '#3D3D41', '#F5F5F5', '#101010'],
};

export const presets = {
  preset_m1_12: { name: '柴犬', version: 1, frame: 'M1', ear: 'E01', muzzle: 'N01', tail: 'T01', eye: 'Y01', palette: 'C01', pattern: 'P00', accessory: null },
  preset_m1_13: { name: '比格犬', version: 1, frame: 'M1', ear: 'E03', muzzle: 'N02', tail: 'T02', eye: 'Y01', palette: 'C03', pattern: 'P00', accessory: null },
  preset_m1_14: { name: '中华田园犬', version: 1, frame: 'M1', ear: 'E01', muzzle: 'N01', tail: 'T02', eye: 'Y01', palette: 'C01', pattern: 'P00', accessory: null },
} satisfies Record<string, Config>;

export type PresetId = keyof typeof presets;

const graphemes = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
export function nameLength(name: string) {
  return Array.from(graphemes.segment(name.trim())).length;
}

export function readConfig(input: unknown): Config {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw Error('配置须为 JSON 对象');
  const data = input as Record<string, unknown>;
  if (data.version !== 1) throw Error('version 须为 1');
  if (data.frame !== 'M1') throw Error('frame 须为 M1');
  if (data.accessory !== null) throw Error('accessory 须为 null');
  if (typeof data.name !== 'string' || nameLength(data.name) < 1 || nameLength(data.name) > 8) {
    throw Error('name 须为 1–8 字');
  }
  for (const part of parts) {
    const value = data[part];
    if (typeof value !== 'string' || !Object.hasOwn(options[part], value)) throw Error(`${part} 缺失或编号无效`);
  }
  // Older exports may contain a retired pattern. Keep the field in v1 JSON.
  if (typeof data.pattern !== 'string' || !/^P0[0-5]$/.test(data.pattern)) throw Error('pattern 缺失或编号无效');
  const config = { version: 1, name: data.name.trim(), frame: 'M1', pattern: 'P00', accessory: null } as Config;
  Object.assign(config, Object.fromEntries(parts.map(part => [part, data[part]])));
  return config;
}
