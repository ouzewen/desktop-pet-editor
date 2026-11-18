import type { CatConfig, catPresets } from './cat';
import type { FurPatch } from './cat-fur-patches';

type CoatFields = Pick<CatConfig, 'palette' | 'coat' | 'pattern' | 'bodyPattern' | 'cheekPattern'
  | 'bodyBase' | 'faceBase' | 'tailPattern' | 'forelegPatternSource' | 'leftEyeColor' | 'rightEyeColor' | 'noseColor'>;

type CoatSet = {
  id: string; name: string; group: 'tabby' | 'white';
  breed: keyof typeof catPresets;
  fields: CoatFields;
  patches: readonly FurPatch[];
};

const patch = (id: string, preset: string, shape: string, box: [number, number, number, number],
  color: string, flipped = false): FurPatch => {
  const [x, y, width, height] = box;
  return { id, preset, shape, x, y, width, height, color, flipped };
};

function tabby(style: 'mackerel' | 'classic' | 'spotted', name: string, shape: 'three' | 'two'): CoatSet {
  // The brown tabby artwork already has a drawn M forehead. The rest of
  // each set links the flank, cheeks, two forelegs and tail to that artwork.
  return {
    id: style, name, group: 'tabby', breed: 'preset_cat_li_hua',
    fields: {
      palette: 'CC07', coat: 'native', pattern: 'P00', faceBase: 'native', bodyBase: 'solid',
      cheekPattern: style === 'spotted' ? 'mackerel' : style, bodyPattern: style,
      tailPattern: style === 'classic' ? 'classic' : 'mackerel', forelegPatternSource: 'separate',
      leftEyeColor: 'olive', rightEyeColor: 'olive', noseColor: 'natural',
    },
    patches: [
      patch('set-left-rings', 'leftRings', shape, [120, 238, 76, 78], '#7B4F35'),
      patch('set-right-rings', 'rightRings', shape, [181, 238, 76, 78], '#7B4F35', true),
    ],
  };
}

const whiteBase = {
  palette: 'CC02', coat: 'native', pattern: 'P00', bodyPattern: 'native', faceBase: 'native',
  cheekPattern: 'native', bodyBase: 'native', tailPattern: 'native', forelegPatternSource: 'native', noseColor: 'lightPink',
} as const;
const warmWhite = '#F2E4D1';
const coolWhite = '#F6EFE2';

export const catCoatSets: readonly CoatSet[] = [
  tabby('mackerel', '细虎斑', 'three'),
  tabby('classic', '经典虎斑', 'two'),
  tabby('spotted', '点状虎斑', 'three'),
  {
    id: 'blaze-white', name: '细白鼻梁 · 黑眼罩', group: 'white', breed: 'preset_cat_black',
    fields: { ...whiteBase, leftEyeColor: 'olive', rightEyeColor: 'olive' },
    patches: [
      patch('set-white-face', 'eye', 'mask', [154, 143, 204, 45], warmWhite),
      patch('set-white-blaze', 'blaze', 'stripe', [160, 111, 45, 89], warmWhite),
      patch('set-white-chest', 'chest', 'full', [149, 215, 145, 106], warmWhite),
      patch('set-left-sock', 'leftSock', 'cuff', [129, 271, 60, 46], warmWhite),
      patch('set-right-sock', 'rightSock', 'cuff', [177, 270, 60, 48], warmWhite),
    ],
  },
  {
    id: 'black-cap', name: '黑头顶 · 白脸', group: 'white', breed: 'preset_cat_black',
    fields: { ...whiteBase, leftEyeColor: 'honeyGold', rightEyeColor: 'honeyGold' },
    patches: [
      patch('set-white-face', 'eye', 'mask', [154, 125, 220, 91], coolWhite),
      patch('set-dark-cap', 'eye', 'cap', [154, 63, 212, 92], '#302930'),
      patch('set-white-chest', 'chest', 'full', [148, 223, 177, 122], coolWhite),
      patch('set-left-foreleg', 'leftForeleg', 'long', [120, 237, 76, 112], coolWhite),
      patch('set-right-foreleg', 'rightForeleg', 'long', [181, 237, 76, 112], coolWhite),
    ],
  },
  {
    id: 'calico-mask', name: '深脸 · 异瞳三花', group: 'white', breed: 'preset_cat_calico',
    fields: { ...whiteBase, palette: 'CC03', faceBase: 'solid', leftEyeColor: 'iceBlue', rightEyeColor: 'olive', noseColor: 'charcoal' },
    patches: [
      patch('set-dark-face', 'eye', 'mask', [153, 116, 206, 88], '#33353E'),
      patch('set-ear-root', 'eye', 'angle', [216, 56, 47, 34], '#AA917D', true),
      patch('set-warm-chest', 'chest', 'drop', [144, 200, 113, 72], '#C1A084'),
    ],
  },
];
