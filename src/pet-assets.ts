// The built-in art contract shared by the renderer, build and Aseprite exporter.
// Paths in files are relative to public/assets, without the PNG extension.
export const PET_SIZE = 160;
export const CAT_SIZE = 320;

export const catPhotoPartPath = 'cat/hd/photo-coat-parts/';

// Side-specific regions follow the preview image, consistent with fur-patch editing.
export const catPhotoPartTaxonomy = [
  {
    id: 'head', label: '头部', categories: [
      { id: 'forehead', label: '额头', regions: [
        { id: 'forehead-left', label: '左额' }, { id: 'forehead-center', label: '额心' }, { id: 'forehead-right', label: '右额' },
        { id: 'forehead-left-brow', label: '左额 · 眉骨', parent: 'forehead-left' },
        { id: 'forehead-right-brow', label: '右额 · 眉骨', parent: 'forehead-right' },
      ] },
      { id: 'eye-surround', label: '眼周', regions: [
        { id: 'eye-surround-left', label: '左眼周' }, { id: 'eye-surround-right', label: '右眼周' },
        { id: 'eye-left-upper', label: '左眼周 · 上缘', parent: 'eye-surround-left' },
        { id: 'eye-left-outer', label: '左眼周 · 外眼角', parent: 'eye-surround-left' },
        { id: 'eye-left-lower', label: '左眼周 · 下缘', parent: 'eye-surround-left' },
        { id: 'eye-right-upper', label: '右眼周 · 上缘', parent: 'eye-surround-right' },
        { id: 'eye-right-outer', label: '右眼周 · 外眼角', parent: 'eye-surround-right' },
        { id: 'eye-right-lower', label: '右眼周 · 下缘', parent: 'eye-surround-right' },
      ] },
      { id: 'cheek', label: '脸颊', regions: [
        { id: 'cheek-left', label: '左脸颊' }, { id: 'cheek-right', label: '右脸颊' },
        { id: 'cheek-left-upper', label: '左脸颊 · 上颊', parent: 'cheek-left' },
        { id: 'cheek-left-lower', label: '左脸颊 · 下颊', parent: 'cheek-left' },
        { id: 'cheek-right-upper', label: '右脸颊 · 上颊', parent: 'cheek-right' },
        { id: 'cheek-right-lower', label: '右脸颊 · 下颊', parent: 'cheek-right' },
      ] },
      { id: 'face-center', label: '面部中心', regions: [
        { id: 'nose-bridge', label: '鼻梁' }, { id: 'muzzle', label: '口鼻' }, { id: 'chin', label: '下巴' },
        { id: 'chin-neck', label: '下巴 · 接颈处', parent: 'chin' },
      ] },
      { id: 'ear', label: '耳朵', regions: [
        { id: 'ear-left', label: '左耳' }, { id: 'ear-right', label: '右耳' },
        { id: 'ear-left-tip', label: '左耳 · 耳尖', parent: 'ear-left' },
        { id: 'ear-left-crown', label: '左耳 · 靠头顶', parent: 'ear-left' },
        { id: 'ear-left-perimeter', label: '左耳 · 靠外轮廓', parent: 'ear-left' },
        { id: 'ear-left-outer', label: '左耳 · 外耳', parent: 'ear-left' },
        { id: 'ear-left-inner', label: '左耳 · 内耳', parent: 'ear-left' },
        { id: 'ear-left-root', label: '左耳 · 耳根', parent: 'ear-left' },
        { id: 'ear-right-tip', label: '右耳 · 耳尖', parent: 'ear-right' },
        { id: 'ear-right-crown', label: '右耳 · 靠头顶', parent: 'ear-right' },
        { id: 'ear-right-perimeter', label: '右耳 · 靠外轮廓', parent: 'ear-right' },
        { id: 'ear-right-outer', label: '右耳 · 外耳', parent: 'ear-right' },
        { id: 'ear-right-inner', label: '右耳 · 内耳', parent: 'ear-right' },
        { id: 'ear-right-root', label: '右耳 · 耳根', parent: 'ear-right' },
      ] },
    ],
  },
  {
    id: 'body', label: '身体', categories: [
      { id: 'chest', label: '胸口', regions: [
        { id: 'chest-center', label: '胸口中央' },
        { id: 'chest-neck', label: '胸口 · 上缘接颈', parent: 'chest-center' },
        { id: 'chest-lower', label: '胸口 · 下缘收口', parent: 'chest-center' },
        { id: 'chest-left-shoulder-seam', label: '胸口 · 左肩交界', parent: 'chest-center' },
        { id: 'chest-right-shoulder-seam', label: '胸口 · 右肩交界', parent: 'chest-center' },
      ] },
      { id: 'shoulder', label: '肩部', regions: [
        { id: 'shoulder-left', label: '左肩' }, { id: 'shoulder-right', label: '右肩' },
      ] },
      { id: 'trunk', label: '躯干', regions: [
        { id: 'back', label: '背部' }, { id: 'flank-left', label: '左侧腰' }, { id: 'flank-right', label: '右侧腰' },
        { id: 'hindquarters', label: '后躯' },
      ] },
      { id: 'foreleg', label: '前肢与前爪', regions: [
        { id: 'foreleg-left', label: '左前肢' }, { id: 'foreleg-right', label: '右前肢' },
        { id: 'front-paw-left', label: '左前爪' }, { id: 'front-paw-right', label: '右前爪' },
        { id: 'foreleg-left-upper', label: '左前肢 · 上段', parent: 'foreleg-left' },
        { id: 'foreleg-left-lower', label: '左前肢 · 下段', parent: 'foreleg-left' },
        { id: 'foreleg-right-upper', label: '右前肢 · 上段', parent: 'foreleg-right' },
        { id: 'foreleg-right-lower', label: '右前肢 · 下段', parent: 'foreleg-right' },
        { id: 'front-toes-left', label: '左前爪 · 趾尖', parent: 'front-paw-left' },
        { id: 'front-toes-right', label: '右前爪 · 趾尖', parent: 'front-paw-right' },
      ] },
      { id: 'tail', label: '尾巴', regions: [
        { id: 'tail-base', label: '尾根' }, { id: 'tail-middle', label: '尾中段' }, { id: 'tail-tip', label: '尾尖' },
      ] },
    ],
  },
  { id: 'overall', label: '整体底毛', categories: [{ id: 'base-coat', label: '底色与明暗', regions: [
    { id: 'base-coat-head-body', label: '全身底毛' },
  ] }] },
] as const;

type CatPhotoRegionId = typeof catPhotoPartTaxonomy[number]['categories'][number]['regions'][number]['id'];

export const catPhotoEarSides = ['left', 'right'] as const;
export const catPhotoEarPlacements = ['crown', 'perimeter'] as const;
export const catPhotoEarCoverages = ['tip', 'middle', 'root'] as const;
export type CatPhotoEarSide = typeof catPhotoEarSides[number];
type CatPhotoEarPlacement = typeof catPhotoEarPlacements[number];
type CatPhotoEarCoverage = typeof catPhotoEarCoverages[number];
type CatPhotoEarPartId = `ear-${CatPhotoEarSide}-${CatPhotoEarPlacement}-${CatPhotoEarCoverage}`;
type CatPhotoEarPart = {
  regions: readonly [`ear-${CatPhotoEarSide}-${CatPhotoEarPlacement}`];
  slot: `ear-${CatPhotoEarSide}`; palette: 'any'; pigment: 'recolorable';
  coverage: CatPhotoEarCoverage; side: CatPhotoEarSide; placement: CatPhotoEarPlacement;
  source: 'ear-markings-round11.aseprite'; format: 'png'; layer: CatPhotoEarPartId;
};
const catPhotoEarParts = Object.fromEntries(catPhotoEarSides.flatMap(side =>
  catPhotoEarPlacements.flatMap(placement => catPhotoEarCoverages.map(coverage => {
    const id = `ear-${side}-${placement}-${coverage}` as const;
    return [id, {
      regions: [`ear-${side}-${placement}`], slot: `ear-${side}`, palette: 'any', pigment: 'recolorable',
      coverage, side, placement, source: 'ear-markings-round11.aseprite', format: 'png', layer: id,
    }] as const satisfies readonly [CatPhotoEarPartId, CatPhotoEarPart];
  })))) as Record<CatPhotoEarPartId, CatPhotoEarPart>;

export const catPhotoParts = {
  ...catPhotoEarParts,
  'asymmetric-dark-crown': {
    regions: ['forehead-left', 'forehead-right', 'ear-right-outer', 'ear-right-root'],
    slot: 'head', palette: 'CC02', coat: 'ivory', pigment: 'black', coverage: 'upper', side: 'right-heavy',
    source: 'push-b3r.aseprite', format: 'png', layer: 'crown',
  },
  'ink-black': {
    regions: ['base-coat-head-body'],
    slot: 'base', palette: 'CC02', pigment: 'black', coverage: 'whole', side: 'center',
    source: 'round-02.aseprite', layer: 'shappo-3', format: 'palette',
  },
  'chin-small': {
    regions: ['chin'],
    slot: 'head', palette: 'CC02', pigment: 'white', coverage: 'small', side: 'center',
    source: 'white-marks.aseprite', format: 'png', layer: 'chin-small',
  },
  'chest-small': {
    regions: ['chest-center'],
    slot: 'torso', palette: 'CC02', pigment: 'white', coverage: 'small', side: 'center',
    source: 'white-marks.aseprite', format: 'png', layer: 'chest-small',
  },
  'calico-wide-chest': {
    regions: ['chest-center'],
    slot: 'torso', palette: 'CC03', pigment: 'white', coverage: 'large', side: 'center',
    source: 'round-03.aseprite', format: 'png', layer: 'chest-3',
  },
} as const satisfies Record<string, {
  regions: readonly [CatPhotoRegionId, ...CatPhotoRegionId[]];
  slot: 'head' | 'torso' | 'base' | `ear-${CatPhotoEarSide}`; palette: string; coat?: string;
  pigment: string; coverage: string; side: string;
  source: string; format: 'png' | 'palette'; layer: string;
}>;
export const catWalkFrames = 4;

const earStyles = {
  CE01: ['三角立耳', 'upright'], CE02: ['折耳', 'folded'], CE03: ['圆耳', 'round'],
  CE04: ['垂耳', 'droopy'], CE05: ['卷耳', 'curled'],
} as const;
// The four columns in the original face atlas also reconstruct old pixel saves.
export const atlasNoseTips = { NO01: 131, NO02: 131, NO03: 130, NO04: 133 } as const;
export const sharedNoseStyles = {
  NO05: ['小方鼻', 125], NO06: ['中鼻', 130], NO07: ['大鼻', 135], NO08: ['长鼻', 136],
} as const;
// Bottom occupied 80×80 row in each layer of centered-noses.aseprite.
export const centeredNoseTips = { NO05: 31, NO06: 32, NO07: 33, NO08: 33 } as const;
export const retiredNoseStyles = { NO01: 'NO05', NO03: 'NO06', NO04: 'NO07' } as const;
export const sharedTailStyles = {
  CT05: '直尾', CT06: '短尾', CT07: 'L字型弯尾', CT08: 'Z字型弯尾', CT09: '卷环型尾',
} as const;
export const retiredTailStyles = { CT01: 'CT05', CT02: 'CT06', CT03: 'CT05', CT04: 'CT07' } as const;
const atlasMouthStems = { CN01: 132, CN02: 132, CN03: 131, CN04: 134 } as const;
export const legacyMouthIds = Object.keys(atlasMouthStems) as (keyof typeof atlasMouthStems)[];
export const mouthStems = Object.values(atlasMouthStems);
export const sharedMouthStyles = {
  CN08: '微笑', CN09: '吐舌', CN05: '凸凸嘴', CN06: '严肃嘴', CN07: '奔驰嘴',
} as const;
export const retiredMouthStyles = { CN01: 'CN05', CN02: 'CN09', CN03: 'CN09', CN04: 'CN06' } as const satisfies
  Record<(typeof legacyMouthIds)[number], keyof typeof sharedMouthStyles>;
export const breedArt = {
  CC01: ['橘白', 'orange'],
  CC02: ['纯黑', 'black'],
  CC03: ['三花', 'calico'],
  CC04: ['暹罗重点色', 'siamese'],
  CC05: ['英短蓝猫', 'british-blue'],
  CC06: ['美短', 'american-shorthair'],
  CC07: ['狸花猫', 'li-hua'],
  CC08: ['布偶猫', 'ragdoll'],
} as const;
type Breed = keyof typeof breedArt;
type FrontBreed = Exclude<Breed, 'CC01'>;
export type LegacyFrontBreed = 'CC02' | 'CC03' | 'CC04';

function labels<T extends Record<string, readonly [string, unknown]>>(items: T) {
  return Object.fromEntries(Object.entries(items).map(([id, [label]]) => [id, label])) as {
    [K in keyof T]: T[K][0]
  };
}

export const catAssetOptions = {
  ear: labels(earStyles),
  nose: { NO02: '圆角鼻', ...labels(sharedNoseStyles) },
  mouth: sharedMouthStyles,
  tail: sharedTailStyles,
  pattern: { P00: '品种原额纹', P03: '无额纹', P01: '白额线', P02: '双眉斑', P05: '小菱纹', P06: '眉斑 + 额线' },
  palette: labels(breedArt),
} as const;
export const retiredForeheadDesigns = { P04: 'P03' } as const;
export const catFrontEars = Object.fromEntries(Object.entries(earStyles).map(([id, [, shape]]) => [id, shape])) as {
  [K in keyof typeof earStyles]: typeof earStyles[K][1]
};
export const foreheadParts = Object.keys(catAssetOptions.pattern).filter(id => id !== 'P00' && id !== 'P03');
export const faceTiles = { left: 128, top: 119, width: 48, height: 44 } as const;
const faceExportArgs = { ...faceTiles, columns: Object.keys(atlasNoseTips).length };

const sharedCatAccessories = {
  A00: '无配饰', A01: '红蝴蝶结', A02: '蓝色小鱼帽', A03: '黄色星星发卡',
} as const;
export const catAccessoryOptions = { ...sharedCatAccessories, A07: '蓝色鸭舌帽' } as const;
export const orangeAccessoryOptions = { ...sharedCatAccessories, A00: '无', A06: '蓝色鸭舌帽' } as const;
export const catExtraEyes = { Y05: '大圆眼', Y06: '半闭眼', Y07: '星星眼' } as const;

export const orangePath = 'cat/new_/CAT_';
export const breedPath = (palette: Breed) => 'cat/hd/breeds/' + palette + '/';
export const sharedBreedParts: Record<FrontBreed, LegacyFrontBreed> = {
  CC02: 'CC02', CC03: 'CC03', CC04: 'CC04',
  CC05: 'CC03', CC06: 'CC03', CC07: 'CC03', CC08: 'CC04',
};
export const breedLaptop = 'cat/hd/breeds/typing_laptop';
export const orangeSquareGlints = 'cat/eye-glints/orange-square-v8';
export const breedEyeGlints = 'cat/hd/breeds/eye_glints';
export const facePartsPath = 'cat/hd/face-parts/';
export const catNosePath = facePartsPath + 'noses/';
export const centeredNosePath = 'cat/centered-noses/';
export const catMouthPath = facePartsPath + 'mouths/';
export const historicalConvexMouthPath = facePartsPath + 'historical-cn05/CN05';
export const historicalConvexLiHuaBacking = facePartsPath + 'historical-cn05/li-hua-backing';
export const mouthSkinPath = catMouthPath + 'skin_cleanup';
export const mouthSkinColumns = 4;
export const legacyNoseOutlinePath = facePartsPath + 'legacy_nose_outline';
export const bodyPatternPath = 'cat/hd/body-patterns/';
export const headPatternPath = 'cat/hd/head-patterns/';
export const calicoCrownPath = 'cat/hd/calico-crown/';
export const calicoFaceFinishPath = calicoCrownPath + 'eye-mask-orange-left-finish';
export const calicoBodyOutlinePath = 'cat/hd/breeds/CC03/body_outline';
export const honeyGoldPath = 'cat/hd/breeds/CC11/';
const honeyGoldParts = ['crown', 'cheeks', 'body', 'tail'] as const;
export const calicoCrownLayouts = ['eye-streak', 'eye-mask', 'high-cap'] as const;
export const earMaskPath = 'cat/hd/ear-masks/';
export const tailPath = 'cat/hd/tails/';
export const initialTailPath = tailPath + 'initial/';
export const referenceTailPath = tailPath + 'reference/';
export const typingEffectPath = 'cat/hd/typing-effects/';
export const catListening = {
  path: 'cat/hd/listening/', frames: 23, columns: 6, frameDuration: 75,
  regions: {
    headband: { x: 43, y: 13, width: 216, height: 96 },
    earcups: { x: 34, y: 55, width: 234, height: 89 },
    closed_eyes: { x: 88, y: 97, width: 126, height: 31 },
    notes: { x: 10, y: 37, width: 289, height: 84 },
  },
} as const;
export const catPetLove = {
  path: 'cat/hd/pet-love/', frames: 30, columns: 6, frameDuration: 48,
  hearts: { x: 144, y: 0, width: 140, height: 92 },
} as const;
export const catShredder = {
  path: 'cat/hd/shredder/', columns: 6,
  durations: [225, 95, 90, 90, 80, 125, 80, 80, 80, 190, 120, 330],
  closedFrames: [6, 8, 9, 10, 11] as readonly number[],
  regions: {
    arms: { x: 76, y: 176, width: 151, height: 38 },
    props: { x: 48, y: 151, width: 208, height: 168 },
    paws: { x: 78, y: 164, width: 146, height: 50 },
  },
} as const;
export const catFileActions = {
  shredder: catShredder,
  zip: {
    path: 'cat/hd/zip/', columns: 6,
    durations: [220, 85, 85, 90, 95, 120, 90, 85, 100, 125, 165, 85, 55, 65, 100, 55, 55, 340],
    closedFrames: [17] as readonly number[],
    regions: {
      arms: { x: 79, y: 174, width: 144, height: 83 },
      props: { x: 48, y: 173, width: 208, height: 125 },
      paws: { x: 84, y: 166, width: 135, height: 96 },
    },
  },
  convert: {
    path: 'cat/hd/convert/', columns: 5,
    durations: [220, 70, 90, 85, 95, 85, 95, 125, 110, 115, 100, 90, 80, 85, 95, 90, 255, 80, 80, 420],
    closedFrames: [19] as readonly number[],
    regions: {
      arms: { x: 79, y: 174, width: 144, height: 65 },
      props: { x: 71, y: 162, width: 157, height: 153 },
      paws: { x: 83, y: 184, width: 136, height: 55 },
    },
  },
} as const;
export const frontTyping = {
  path: 'cat/hd/typing-front/', frames: 64, pawFrames: 16, columns: 8,
  region: { x: 48, y: 140, width: 208, height: 49 },
} as const;
export const frontTypingEffectsPath = 'cat/hd/typing-falling/';
const fallingLetterRegion = { x: 0, y: 90, width: 320, height: 200, frames: frontTyping.frames } as const;
export const frontTypingEffects = {
  gentle: fallingLetterRegion,
  fast: fallingLetterRegion,
  frenzy: fallingLetterRegion,
  paws: { ...frontTyping.region, frames: frontTyping.pawFrames },
  heat: { x: 63, y: 189, width: 177, height: 98, frames: frontTyping.frames },
  air: { x: 48, y: 151, width: 224, height: 38, frames: frontTyping.frames },
  sparks: { x: 48, y: 151, width: 224, height: 38, frames: frontTyping.frames },
  steam: { x: 128, y: 152, width: 48, height: 37, frames: frontTyping.frames },
  sweat: { x: 32, y: 32, width: 240, height: 64, frames: frontTyping.frames },
} as const;
export const typingAtlases = {
  reference: { path: 'cat/hd/typing-reference/', frames: 12 },
  'reference-v2': { path: 'cat/hd/typing-v2/', frames: 32 },
} as const;
const typingModes = ['gentle', 'fast', 'frenzy'] as const;
const sharedTypingGeometry = { arms: 'arms', paws: 'paws_mask' } as const;
export const typingInkPatches = { forearm: 'forearm_ink_cleanup', mouth: 'mouth_ink_cleanup' } as const;
export function typingGeometryPart(
  part: keyof typeof sharedTypingGeometry, animation: keyof typeof typingAtlases, mode: typeof typingModes[number],
) {
  return animation === 'reference-v2' ? sharedTypingGeometry[part] : `${part}_${mode}`;
}
export const typingReferencePath = typingAtlases.reference.path;
export const walkEyeGlints = 'cat/walk_eye_Y01_glints';

const indices = (count: number) => Array.from({ length: count }, (_, i) => i);
export const dogArt = {
  tail: ['T01', 'T02'], ear: ['E01', 'E02', 'E03', 'E04'],
  eye: ['Y01', 'Y02', 'Y03', 'Y04'], muzzle: ['N01', 'N02', 'N03'],
} as const;
export const runBodies = indices(6).map(i => 'motion/run_body_' + i);
export const furSlots = ['g', 's', 'l'] as const;
export const irisPath = (layer: string) => 'masks/' + layer.split('/').at(-1) + '_iris';
export const maskPath = (layer: string, slot: typeof furSlots[number]) => 'masks/' + layer.split('/').at(-1) + '_' + slot;
const dogFur = [
  ...runBodies,
  ...['left_0', 'left_1', 'right_0', 'right_1'].map(id => 'motion/type_paw_' + id),
  'motion/type_body', 'motion/run_head',
  ...dogArt.tail.map(id => 'motion/run_tail_' + id),
  ...dogArt.ear.map(id => 'motion/run_ear_' + id),
  ...dogArt.muzzle.map(id => 'motion/run_muzzle_' + id),
  'frames/M1_body', 'frames/M1_head_base', 'parts/M1_face_P01', 'parts/M1_face_P02',
  ...dogArt.tail.map(id => 'parts/M1_tail_' + id),
  ...dogArt.ear.map(id => 'parts/M1_ear_' + id),
];
const dogLayers = [
  ...dogFur,
  'motion/type_keyboard', 'motion/type_screen', 'motion/run_face_P01', 'motion/run_face_P02',
  ...dogArt.eye.flatMap(id => ['motion/run_eye_' + id, 'parts/M1_eye_' + id]),
  ...dogArt.muzzle.map(id => 'parts/M1_muzzle_' + id),
  ...['Y01', 'Y03', 'Y04'].flatMap(id => [irisPath('parts/M1_eye_' + id), irisPath('motion/run_eye_' + id)]),
  ...dogFur.flatMap(layer => furSlots.map(slot => maskPath(layer, slot))),
  'masks/M1_eye_Y01_g', 'masks/M1_eye_Y01_s', 'masks/M1_muzzle_N01_s', 'masks/M1_muzzle_N01_l',
];

const olderTyping = (mode: 'gentle' | 'fast') => [
  ...indices(4).map(i => 'typing_arms_' + mode + '_' + i),
  ...(mode === 'gentle' ? ['typing_body'] : indices(3).map(i => 'typing_front_' + i)),
];
const bodyPatternLayers = ['body', ...olderTyping('gentle'), ...olderTyping('fast')];
const catEyes = [...dogArt.eye, ...Object.keys(catExtraEyes)];
export const catWalkBodies = indices(catWalkFrames).map(i => 'walk_body_' + i);
const catWalkFurLayers = [
  ...catWalkBodies, 'walk_head', 'walk_head_alt', 'walk_ears', 'walk_tail', 'walk_muzzle',
  'walk_ear_CE02', 'walk_ear_CE04',
  ...legacyMouthIds.filter(id => id !== 'CN01').map(id => 'walk_muzzle_' + id),
];
export const catCalicoLayers = new Set([...catWalkBodies, 'walk_head', 'walk_head_alt', 'walk_tail']);
export const catFurSlots = ['g', 's', 'l', 'w', 'd'] as const;
export const catMarkings = ['P01', 'P02'] as const;
const walkLayers = [
  ...catWalkFurLayers.flatMap(layer => [
    'cat/' + layer, ...catFurSlots.map(slot => 'cat/masks/' + layer + '_' + slot),
    ...(catCalicoLayers.has(layer) ? ['cat/masks/' + layer + '_calico', 'cat/masks/' + layer + '_calico_right'] : []),
  ]),
  ...catEyes.map(id => 'cat/walk_eye_' + id),
  ...catEyes.filter(id => id !== 'Y02').map(id => 'cat/masks/walk_eye_' + id + '_iris'),
  ...catMarkings.map(id => 'cat/walk_face_' + id),
];
const earShapes = Object.values(catFrontEars);
const alternativeEars = earShapes.filter(shape => shape !== 'upright');
const frontFaceMarkings = ['P01', 'P02', 'P06'].map(id => 'face_' + id);
const legacyBreedLayers = [
  ...frontFaceMarkings, 'eye_Y02',
  ...catEyes.filter(id => id !== 'Y01' && id !== 'Y02').flatMap(id => ['eye_' + id, 'eye_' + id + '_iris']),
  ...['Y03', 'Y04', 'Y05', 'Y06'].map(id => 'eye_' + id + '_aperture'),
  ...alternativeEars.map(shape => 'ear_' + shape),
];
const breedFrontLayers = ['body', 'head', 'ear_upright', 'eyes', 'iris', 'aperture'];

type Usage = 'current' | 'compatibility' | 'archive';
type Consumer = 'cat' | 'dog';
type ExportJob = {
  source: string;
  layer: string;
  frame?: number;
  output: string;
} | {
  source: string;
  script: string;
  outputDir: string;
  args?: Record<string, string | number>;
  outputArgs?: Record<string, string>;
};
export type AssetFile = { key: string; width: number; height: number };
export type AssetGroup = {
  id: string;
  usage: Usage;
  consumer?: Consumer;
  files: readonly AssetFile[];
  sources: readonly string[];
  jobs: readonly ExportJob[];
  note?: string;
};

const pngs = (keys: readonly string[], size: number = CAT_SIZE, frames = 1) =>
  keys.map(key => ({ key, width: size, height: size * frames }));

function group(id: string, usage: Usage, files: readonly AssetFile[], jobs: readonly ExportJob[] = [],
  extra: Pick<AssetGroup, 'consumer' | 'sources' | 'note'> = { sources: [] }): AssetGroup {
  return { id, usage, files, jobs, ...extra, sources: [...new Set([...extra.sources, ...jobs.map(job => job.source)])] };
}

const cat = { consumer: 'cat', sources: [] } as const;
const withPrefix = (prefix: string, names: readonly string[]) => names.map(name => prefix + name);

function layerGroup(id: string, usage: Usage, source: string, layer: string, output: string,
  extra: Pick<AssetGroup, 'consumer' | 'sources' | 'note'> = cat, size = CAT_SIZE) {
  return group(id, usage, pngs([output], size), [{ source, layer, output }], extra);
}

function scriptGroup(id: string, usage: Usage, source: string, script: string, outputDir: string,
  files: AssetFile[], args?: Record<string, string | number>, outputArgs?: Record<string, string>) {
  return group(id, usage, files, [{ source, script: 'scripts/' + script + '.lua', outputDir, args, outputArgs }], cat);
}

const mappedBreeds = (Object.keys(breedArt) as Breed[]).filter((id): id is FrontBreed => id !== 'CC01');
const typingV2Atlas = typingAtlases['reference-v2'];
const fallingTypingGroups = typingModes.map(mode => {
  const parts: (keyof typeof frontTypingEffects)[] = mode === 'frenzy' ? [mode, 'paws', 'heat', 'air', 'sparks', 'steam', 'sweat'] : [mode];
  const args: Record<string, string | number> = { mode, frames: frontTyping.frames, columns: frontTyping.columns };
  const files = parts.map(part => {
    const { x, y, width, height, frames } = frontTypingEffects[part];
    args[part] = [x, y, width, height, frames].join(',');
    return { key: frontTypingEffectsPath + part, width: width * frontTyping.columns, height: height * frames / frontTyping.columns };
  });
  if (mode === 'frenzy') files.push(...pngs(withPrefix(frontTypingEffectsPath, ['mouth', 'mouth_orange'])));
  const source = mode === 'frenzy' ? 'typing-frenzy' : `typing-${mode}-falling`;
  const version = mode === 'fast' ? 'front-v6' : 'front-v4';
  return scriptGroup(`cat.typing.${version}.${mode}`, 'current', `art/cat-shared/${source}.aseprite`,
    'export-cat-typing-falling', frontTypingEffectsPath, files, args);
});
const oldModes = ['gentle', 'fast'] as const;
const legacyTailIds = Object.keys(retiredTailStyles).filter(id => id !== 'CT01');
const newTailIds = Object.keys(sharedTailStyles);
const tailPoses = ['idle', 'typing'];
const tailFiles = (pose: string, ids: string[], path = tailPath) => ids.flatMap(id => [
  path + pose + '_' + id, path + pose + '_' + id + '_patterns',
]);
const archived = { sources: [] } as const;

const oldCatFur = [
  'sit_body', 'sit_ear_CE02', 'sit_ear_CE04', 'sit_ears', 'sit_head', 'sit_head_alt', 'sit_tail',
  'sit_muzzle', 'sit_muzzle_CN02', 'sit_muzzle_CN03', 'sit_muzzle_CN04',
  'type_body', 'type_tail', 'type_paw_l0', 'type_paw_l1', 'type_paw_r0', 'type_paw_r1',
];
const oldCatLayers = [
  ...withPrefix('cat/', oldCatFur), 'cat/type_keyboard', 'cat/type_screen',
  ...catEyes.map(id => 'cat/sit_eye_' + id),
  ...catMarkings.map(id => 'cat/sit_face_' + id),
  ...oldCatFur.flatMap(layer => catFurSlots.map(slot => 'cat/masks/' + layer + '_' + slot)),
  ...withPrefix('cat/masks/', ['sit_body', 'sit_head', 'sit_head_alt', 'sit_tail', 'type_body', 'type_tail'].map(layer => layer + '_calico')),
  ...catEyes.filter(id => id !== 'Y02').map(id => 'cat/masks/sit_eye_' + id + '_iris'),
];
const oldHdLayers = [
  ...[1, 2, 3, 4, 5].map(i => 'accessory_A0' + i),
  ...[1, 2, 3, 4].map(i => 'coat_CC0' + i),
  ...[2, 3, 4, 5].flatMap(i => ['', '_g', '_l', '_s'].map(suffix => 'ear_CE0' + i + suffix)),
  ...[5, 6, 7].flatMap(i => ['eye_Y0' + i, 'eye_Y0' + i + '_iris']),
  ...indices(4).flatMap(i => ['fast_' + i, 'fast_paw_' + i, ...['', '_g', '_l', '_s'].map(suffix => 'fast_arm_' + i + suffix)]),
  'mark_P01', 'mark_P02', 'mouth_CN02', 'mouth_CN03', 'mouth_CN04', 'point_CC03', 'point_CC04',
  'siamese_ear_base', 'slow', 'slow_paw', 'typing_icon', 'whiskers',
];

export const catEarRetouchPath = 'cat/ear-retouch/';
export const orangePawsBodyPath = 'cat/body-retouch/orange-paws-v5';
export const orangeBodyOutlinePath = 'cat/body-retouch/orange-body-outline-v11';
export const liHuaCoatPath = 'cat/li-hua-v13/';
export const liHuaLibTVCoatPath = 'cat/li-hua-v14/';
export const liHuaSampledPath = 'cat/li-hua-v16/';
export const liHuaFrenzyFurAsset = 'cat/li-hua-v19/frenzy-mouth-fur';
export const liHuaReferenceCheekAsset = 'cat/li-hua-v15/head';
export const approvedRestingCatPath = 'cat/resting-30/';
export const calicoBodyIndex = 'cat/shared-calico-body/body-index';
export const standingEarPath = 'cat/standing-ears-v25/';
export const frontPawSolesPath = 'cat/front-paw-soles-v26/';
export const frontPawSoleGuide = frontPawSolesPath + 'guide';
export const updatedRestingCatPath = 'cat/resting-v30/';
export const siameseCleanBodyPath = 'cat/siamese-clean-body/torso';
export const catComponentRecipePath = 'cat/component-recipes-v40/';
export const catChestWhitePath = 'cat/component-chest-v42/';
export const catForeheadLockPath = 'cat/component-forehead-v43/';
export const frontGloveGuide = 'cat/front-glove/front-glove';
export const orangeStripeRestingAsset = 'cat/resting-v31/orange';
export const chinShadeMask = 'cat/chin-shading/shared';
export const combinedRestingCatPath = 'cat/resting-v29/';
export const diluteEarMarkPath = 'cat/dilute-ear-mark-v27/';
export const diluteEarMarkPatch = diluteEarMarkPath + 'left-crown';
export const diluteEarMarkStock = diluteEarMarkPath + 'CC12';
export const approvedRestingCatIds = [
  'black', 'CC09', 'orange', 'british_blue', 'american_shorthair', 'CC11',
  'siamese', 'ragdoll', 'li_hua', 'CC10', 'calico', 'CC12',
] as const;
export const sharedRestingOutlinePath = 'cat/body-retouch/shared-v22/';
export const breedBodyOutlinePath = 'cat/body-retouch/breeds-v12/';
export const orangeForelegBodyPath = 'cat/body-retouch/orange-foreleg-v4';
export const catFaceEdgesPath = 'cat/face-edges/';
export const restingSmilePath = catFaceEdgesPath + 'shared/resting-smile';
export const reviewedRestingSmilePath = restingSmilePath + '-reviewed';
export const catBreedDetailsPath = catFaceEdgesPath + 'breed-details/';
export const catHeadCleanupPath = catFaceEdgesPath + 'head-cleanup/';
export const catBreedDetailPresets = {
  black: 'preset_cat_black',
  'british-blue': 'preset_cat_british_blue',
  'american-shorthair': 'preset_cat_american_shorthair',
  'li-hua': 'preset_cat_li_hua',
  calico: 'preset_cat_calico',
  siamese: 'preset_cat_siamese',
  ragdoll: 'preset_cat_ragdoll',
  white: 'preset_cat_CC09',
  tortoiseshell: 'preset_cat_CC10',
  golden: 'preset_cat_CC11',
  'dilute-calico': 'preset_cat_CC12',
} as const;

const faceEdgeParts = ['ear-left', 'ear-left-erase', 'ear-right', 'ear-right-erase', 'whiskers', 'whiskers-erase', 'mouth'];

export const sharedTabbyCheekPath = catFaceEdgesPath + 'shared-tabby-cheeks/';
export const orangeForeheadPatch = 'cat/orange-forehead-v35/forehead';
export const liHuaCrownTone = 'cat/li-hua-crown-v36/crown';
export const goldenFlankTone = 'cat/golden-flank-v37/flank';
export const goldenChinTone = 'cat/golden-chin-v38/chin';
export const assetGroups: readonly AssetGroup[] = [
  group('cat.component-recipes', 'current', [
    ...pngs(withPrefix(catComponentRecipePath, approvedRestingCatIds.flatMap(id => [id + '-stock', id + '-native-edit-mask', id + '-coat-roles', id + '-mouth-backing', id + '-eyes-backing'])), 80),
    ...pngs(withPrefix(catComponentRecipePath, ['CE01-left-mask', 'CE01-right-mask']), 80),
    ...approvedRestingCatIds.map(id => ({ key: catComponentRecipePath + id + '-ear-swatches', width: 4, height: 1 })),
  ], [{
    source: 'art/cat-pixel80/component-recipes84/shared.aseprite',
    script: 'scripts/export-cat-component-recipes.lua', outputDir: catComponentRecipePath, args: { runtime: 1, coatRoles: 1 },
  }], {
    ...cat, sources: approvedRestingCatIds.map(id => 'art/cat-pixel80/component-recipes84/' + id + '.aseprite'),
  }),
  scriptGroup('cat.component-recipes.siamese-body', 'current', 'art/cat-pixel80/siamese-clean-body.aseprite',
    'export-cat-siamese-clean-body', 'cat/siamese-clean-body/', pngs([siameseCleanBodyPath], 80)),
  group('cat.component-recipes.chest-white', 'current',
    pngs(withPrefix(catChestWhitePath, ['calico', 'CC12']), 80), [{
      source: 'art/cat-pixel80/component-recipes84/shared.aseprite',
      script: 'scripts/export-cat-component-recipes.lua', outputDir: catChestWhitePath, args: { chestWhite: 1 },
    }], {
      ...cat, sources: ['calico', 'CC12'].map(id => 'art/cat-pixel80/component-recipes84/' + id + '.aseprite'),
    }),
  group('cat.component-recipes.forehead-lock', 'current',
    pngs(withPrefix(catForeheadLockPath, approvedRestingCatIds), 80), [{
      source: 'art/cat-pixel80/component-recipes84/shared.aseprite',
      script: 'scripts/export-cat-component-recipes.lua', outputDir: catForeheadLockPath, args: { forehead: 1 },
    }], {
      ...cat, sources: approvedRestingCatIds.map(id => 'art/cat-pixel80/component-recipes84/' + id + '.aseprite'),
    }),
  scriptGroup('cat.face-edges.shared-tabby-cheeks', 'current', 'art/cat-pixel80/shared-tabby-cheeks/cheeks.aseprite',
    'export-cat-shared-cheeks', sharedTabbyCheekPath,
    pngs(withPrefix(sharedTabbyCheekPath, ['stripes', 'orange-restore', 'li-hua-restore']), 80)),
  scriptGroup('cat.forehead.orange-native-v35', 'current', 'art/cat-pixel80/orange-forehead-v35/forehead.aseprite',
    'export-cat-resting-30', 'cat/orange-forehead-v35/', pngs([orangeForeheadPatch], 80), { id: 'forehead' }),
  scriptGroup('cat.li-hua-coat.crown-tones', 'current', 'art/cat-pixel80/li-hua-crown-v36/crown.aseprite',
    'export-cat-resting-30', 'cat/li-hua-crown-v36/', pngs([liHuaCrownTone], 80), { id: 'crown' }),
  scriptGroup('cat.body-outline.golden-flank', 'current', 'art/cat-pixel80/golden-flank-v37/flank.aseprite',
    'export-cat-resting-30', 'cat/golden-flank-v37/', pngs([goldenFlankTone], 80), { id: 'flank' }),
  scriptGroup('cat.body-outline.golden-chin', 'current', 'art/cat-pixel80/golden-chin-v38/chin.aseprite',
    'export-cat-resting-30', 'cat/golden-chin-v38/', pngs([goldenChinTone], 80), { id: 'chin' }),
  group('dog.m1', 'compatibility', pngs(dogLayers, PET_SIZE), [], {
    consumer: 'dog', sources: [], note: 'Retained PNGs for the standalone Web editor and native fallback.',
  }),
  group('cat.orange.base', 'current', pngs(withPrefix(orangePath, ['body', 'head_base', 'iris'])), [], {
    consumer: 'cat', sources: ['orange_cat.aseprite'], note: 'Original reference source; the refined head and iris PNGs are retained.',
  }),
  scriptGroup('cat.orange.foreleg', 'current', 'art/cat-pixel80/body-retouch/orange-left-foreleg.aseprite',
    'export-cat-orange-foreleg', 'cat/body-retouch', pngs([orangeForelegBodyPath])),
  scriptGroup('cat.orange.paws', 'current', 'art/cat-pixel80/body-retouch/orange-four-paws.aseprite',
    'export-cat-orange-paws', 'cat/body-retouch', pngs([orangePawsBodyPath])),
  scriptGroup('cat.orange.body-outline', 'current', 'art/cat-pixel80/body-retouch/orange-body-outline.aseprite',
    'export-cat-orange-body-outline', 'cat/body-retouch', pngs([orangeBodyOutlinePath])),
  ...(['curled', 'droopy'] as const).map(shape => scriptGroup('cat.ear-retouch.' + shape, 'current',
    `art/cat-pixel80/ear-retouch/${shape}.aseprite`, 'export-cat-ear-retouch', catEarRetouchPath,
    pngs([catEarRetouchPath + shape]), { shape })),
  ...earShapes.map(shape => layerGroup('cat.ear.' + shape, 'current',
    'art/orange-cat/ears/' + shape + '.aseprite', 'ears', orangePath + 'ear_' + shape)),
  ...Object.keys(orangeAccessoryOptions).filter(id => id !== 'A00').map(id =>
    layerGroup('cat.accessory.' + id, 'current', 'art/orange-cat/accessory/' + id + '.aseprite', 'accessory', orangePath + 'accessory_' + id)),
  ...frontFaceMarkings.map(name => layerGroup('cat.orange.' + name, 'compatibility',
    'art/orange-cat/face/' + name.slice(5) + '.aseprite', 'face', orangePath + name)),
  ...oldModes.map(mode => scriptGroup('cat.orange.typing.' + mode, 'compatibility',
    'art/orange-cat/typing/' + mode + '.aseprite', 'export-orange-typing', 'cat/new_',
    pngs(withPrefix(orangePath, [...olderTyping(mode), ...(mode === 'gentle' ? ['typing_laptop'] : [])])), { mode })),
  scriptGroup('cat.orange-square-glints', 'current', 'art/cat-pixel80/orange-glints/orange-square-glints.aseprite',
    'export-cat-orange-glints', 'cat/eye-glints', pngs([orangeSquareGlints])),
  group('cat.eye-glints', 'current', pngs([orangePath + 'eye_glints', breedEyeGlints]), [
    { source: 'art/cat-breeds/eye-glints.aseprite', layer: 'CAT_eye_glints', output: orangePath + 'eye_glints' },
    { source: 'art/cat-breeds/eye-glints.aseprite', layer: 'breed_eye_glints', output: breedEyeGlints },
  ], cat),
  scriptGroup('cat.ear-masks', 'current', 'art/cat-shared/front-ear-masks.aseprite', 'export-cat-ear-masks',
    earMaskPath, pngs(withPrefix(earMaskPath, alternativeEars))),
  group('cat.breed.CC11', 'current', pngs(withPrefix(honeyGoldPath, honeyGoldParts)),
    honeyGoldParts.map(layer => ({
      source: 'art/cat-breeds/golden-shaded-fur.aseprite', layer, output: honeyGoldPath + layer,
    })), cat),
  ...Object.entries(catPhotoParts).map(([id, part]) => {
    const source = 'art/cat-shared/photo-coat-parts/' + part.source;
    const groupId = 'cat.photo-part.' + id;
    return part.format === 'png' ? layerGroup(groupId, 'current', source, part.layer, catPhotoPartPath + id)
      : group(groupId, 'current', [], [], { sources: [source], note: 'Reference palette applied per component.' });
  }),
  layerGroup('cat.calico-face-finish', 'current', 'art/cat-shared/photo-coat-parts/calico-h3r3.aseprite',
    'facial-fur', calicoFaceFinishPath),
  group('cat.calico-body-outline', 'current', pngs([calicoBodyOutlinePath]), [], {
    consumer: 'cat', sources: ['art/cat-pixel80/cat.calico-body-outline.aseprite'],
    note: 'Export with scripts/stage-cat-pixel80.mjs cat.calico-body-outline.',
  }),
  scriptGroup('cat.calico-crown', 'current', 'art/cat-shared/calico-crown.aseprite', 'export-calico-crown',
    calicoCrownPath, pngs(withPrefix(calicoCrownPath, ['head', 'ears', ...calicoCrownLayouts.flatMap(layout =>
      ['orange-left', 'orange-right'].flatMap(side => ['head', 'ears'].map(part => `${layout}-${side}-${part}`)))]))),
  scriptGroup('cat.face-fur', 'current', 'art/cat-shared/face-fur-patterns.aseprite', 'export-cat-head-patterns',
    headPatternPath, pngs(withPrefix(headPatternPath, ['forehead_region', 'face_region', 'face_patterns']))),
  ...[...foreheadParts, ...Object.keys(retiredForeheadDesigns)].map(id =>
    scriptGroup('cat.forehead.' + id, id in retiredForeheadDesigns ? 'compatibility' : 'current',
      'art/cat-shared/forehead/' + id + '.aseprite', 'export-cat-head-patterns', headPatternPath,
      pngs([headPatternPath + 'forehead_' + id]))),
  scriptGroup('cat.body-patterns', 'current', 'art/cat-shared/front-body-patterns.aseprite', 'export-cat-body-patterns',
    bodyPatternPath, pngs(withPrefix(bodyPatternPath, bodyPatternLayers))),
  group('cat.tails', 'current', pngs(tailPoses.flatMap(pose => [
    tailPath + pose + '_remove',
    ...tailFiles(pose, legacyTailIds),
  ])), legacyTailIds.map(id => ({
    source: 'art/cat-shared/tails/' + id + '.aseprite', script: 'scripts/export-cat-tails.lua',
    outputDir: tailPath, args: { id },
  })), { ...cat, note: 'Original tail removal masks and retired tail art used by saved pixel edits.' }),
  scriptGroup('cat.tails.shared', 'current', 'art/cat-shared/front-tails.aseprite', 'export-cat-front-tails',
    tailPath, pngs(tailPoses.flatMap(pose => tailFiles(pose, newTailIds)))),
  scriptGroup('cat.tails.initial', 'compatibility', 'art/cat-shared/tails/front-tails-initial.aseprite', 'export-cat-front-tails',
    initialTailPath, pngs(tailPoses.flatMap(pose => tailFiles(pose, newTailIds, initialTailPath)))),
  scriptGroup('cat.tails.reference', 'compatibility', 'art/cat-shared/front-tails.aseprite', 'export-cat-front-tails',
    referenceTailPath, pngs(tailPoses.flatMap(pose => tailFiles(pose, newTailIds, referenceTailPath))), { previousEdges: 1 }),
  scriptGroup('cat.face-parts', 'current', 'art/cat-shared/front-face-parts.aseprite', 'export-cat-face-parts',
    facePartsPath, pngs(withPrefix(facePartsPath, ['CC01', 'CC02', 'CC03', 'CC04'])), faceExportArgs),
  group('cat.noses', 'current', pngs(withPrefix(catNosePath, Object.keys(sharedNoseStyles))),
    Object.keys(sharedNoseStyles).map((layer, index) => ({
      source: 'art/cat-shared/front-noses.aseprite', layer, frame: index + 1, output: catNosePath + layer,
    })), cat),
  group('cat.centered-noses', 'current', pngs(withPrefix(centeredNosePath, Object.keys(centeredNoseTips)), 80),
    Object.keys(centeredNoseTips).map(layer => ({
      source: 'art/cat-pixel80/centered-noses.aseprite', layer, frame: 1, output: centeredNosePath + layer,
    })), cat),
  scriptGroup('cat.mouths.historical-cn05', 'current', 'art/cat-pixel80/historical-cn05.aseprite',
    'export-cat-historical-cn05', facePartsPath + 'historical-cn05/', pngs([historicalConvexMouthPath, historicalConvexLiHuaBacking])),
  group('cat.mouths', 'current', pngs([...withPrefix(catMouthPath, Object.keys(sharedMouthStyles)), mouthSkinPath]), [
    // The Aseprite frames run from CN05 to CN09 independently of menu order.
    ...Object.keys(sharedMouthStyles).sort().map((id, index) => ({
      source: 'art/cat-shared/front-mouths.aseprite', layer: 'mouth', frame: index + 1, output: catMouthPath + id,
    })),
    { source: 'art/cat-shared/front-mouths.aseprite', layer: 'skin_cleanup', frame: 1, output: mouthSkinPath },
  ], cat),
  group('cat.legacy-nose-outline', 'compatibility', pngs([legacyNoseOutlinePath]), [], {
    ...cat, note: 'Preserved outline removed from the original CC05–CC08 NO01 cels.',
  }),
  ...mappedBreeds.flatMap(palette => {
    const path = breedPath(palette);
    const slug = breedArt[palette][1];
    const source = 'art/cat-breeds/' + slug + '-front.aseprite';
    const frontId = 'cat.breed.' + palette;
    const front = pngs(withPrefix(path, breedFrontLayers));
    if (sharedBreedParts[palette] === palette) {
      return [
        group(frontId, 'current', front, breedFrontLayers.map(layer => ({ source, layer, output: path + layer })), cat),
        group(frontId + '.legacy', 'compatibility', pngs(withPrefix(path, legacyBreedLayers)),
          legacyBreedLayers.map(layer => ({ source, layer, output: path + layer })), cat),
        ...oldModes.map(mode => group(frontId + '.typing.' + mode, 'compatibility', pngs(withPrefix(path, olderTyping(mode))), [], {
          ...cat, sources: ['art/cat-breeds/' + slug + '-typing-' + mode + '.aseprite'],
          note: 'Retained four-frame exports, also used as color samples by the current animation.',
        })),
      ];
    }
    const face = facePartsPath + palette;
    return [
      scriptGroup(frontId, 'current', source, 'export-front-breed', path, [...front, ...pngs([face])], faceExportArgs, { face }),
      scriptGroup(frontId + '.typing', 'compatibility', 'art/cat-breeds/' + slug + '-typing.aseprite',
        'export-front-breed', path, pngs(withPrefix(path, [...olderTyping('gentle'), ...olderTyping('fast')]))),
    ];
  }),
  ...typingModes.map(mode => scriptGroup('cat.typing.reference.' + mode, 'compatibility',
    'art/cat-shared/typing-reference/' + mode + '.aseprite', 'export-cat-typing-reference', typingReferencePath, [
      ...pngs(withPrefix(typingReferencePath, [
        typingGeometryPart('arms', 'reference', mode), typingGeometryPart('paws', 'reference', mode),
        ...(mode === 'gentle' ? [] : ['sweat_' + mode]),
      ]), CAT_SIZE, typingAtlases.reference.frames),
      ...pngs(withPrefix(typingReferencePath,
        mode === 'fast' ? ['mouth_flat', 'mouth_smile', 'mouth_region'] : mode === 'frenzy' ? ['effort_eyes'] : [])),
    ], { mode, frames: typingAtlases.reference.frames })),
  scriptGroup('cat.typing.front-v3', 'current', 'art/cat-shared/typing-front.aseprite',
    'export-cat-typing-front', frontTyping.path, [
      ...pngs([frontTyping.path + 'laptop']),
      ...(['paws', 'letters'] as const).map(part => ({
        key: frontTyping.path + part,
        width: frontTyping.region.width * frontTyping.columns,
        height: frontTyping.region.height * (part === 'paws' ? frontTyping.pawFrames : frontTyping.frames) / frontTyping.columns,
      })),
    ], { frames: frontTyping.frames, pawFrames: frontTyping.pawFrames, columns: frontTyping.columns, ...frontTyping.region }),
  ...fallingTypingGroups,
  scriptGroup('cat.listening', 'current', 'art/cat-shared/listening.aseprite',
    'export-cat-listening', catListening.path, Object.entries(catListening.regions).map(([part, { width, height }]) => ({
      key: catListening.path + part,
      width: width * catListening.columns,
      height: height * Math.ceil(catListening.frames / catListening.columns),
    })), {
      frames: catListening.frames, columns: catListening.columns,
      duration: catListening.frameDuration,
      ...Object.fromEntries(Object.entries(catListening.regions).map(([part, region]) => [part, Object.values(region).join(',')])),
    }),
  ...(['orange', 'calico'] as const).map(breed => {
    const path = catFaceEdgesPath + breed + '/';
    return scriptGroup('cat.face-edges.' + breed, 'current', `art/cat-pixel80/face-edges/${breed}-b3.aseprite`,
      'export-cat-face-edges', path, pngs(withPrefix(path, faceEdgeParts), 80));
  }),
  ...(['orange', 'calico'] as const).map(breed => {
    const path = catFaceEdgesPath + breed + '/';
    return scriptGroup('cat.face-edges.centered-mouth.' + breed, 'current',
      `art/cat-pixel80/mouth-retouch/${breed}-centered-mouth.aseprite`, 'export-cat-centered-mouth',
      path, pngs([path + 'mouth-b'], 80));
  }),
  ...(['orange', 'calico'] as const).map(breed => {
    const path = catFaceEdgesPath + breed + '/';
    return scriptGroup('cat.face-edges.narrow-nose.' + breed, 'current',
      `art/cat-pixel80/nose-retouch/${breed}-narrow-nose.aseprite`, 'export-cat-narrow-nose',
      path, pngs([path + 'nose-mouth-x37'], 80));
  }),
  scriptGroup('cat.face-edges.resting-smile', 'current', 'art/cat-pixel80/mouth-retouch/shared-resting-smile.aseprite',
    'export-cat-resting-smile', catFaceEdgesPath + 'shared/', pngs([restingSmilePath, restingSmilePath + '-restore'], 80)),
  scriptGroup('cat.face-edges.resting-smile.reviewed', 'current', 'art/cat-pixel80/mouth-retouch/shared-resting-smile-reviewed.aseprite',
    'export-cat-resting-smile', catFaceEdgesPath + 'shared/', pngs([reviewedRestingSmilePath, reviewedRestingSmilePath + '-fur'], 80),
    { reviewed: 'yes' }),
  scriptGroup('cat.li-hua-coat', 'current', 'art/cat-pixel80/li-hua-redesign/native-coat.aseprite',
    'export-cat-li-hua-coat', liHuaCoatPath, pngs(withPrefix(liHuaCoatPath, ['head', 'body']))),
  scriptGroup('cat.li-hua-coat.libtv', 'current', 'art/cat-pixel80/li-hua-redesign/libtv-coat.aseprite',
    'export-cat-li-hua-coat', liHuaLibTVCoatPath, pngs(withPrefix(liHuaLibTVCoatPath, ['head', 'body'])), { pattern: 'libtv' }),
  scriptGroup('cat.li-hua-coat.cheeks', 'current', 'art/cat-pixel80/li-hua-redesign/reference-cheeks.aseprite',
    'export-cat-li-hua-coat', 'cat/li-hua-v15/', pngs([liHuaReferenceCheekAsset]), { pattern: 'reference-cheeks' }),
  scriptGroup('cat.li-hua-coat.sampled', 'current', 'art/cat-pixel80/li-hua-redesign/sampled-reference.aseprite',
    'export-cat-li-hua-coat', liHuaSampledPath, pngs(withPrefix(liHuaSampledPath, ['head', 'ears', 'body', 'tail'])), { pattern: 'sampled-reference' }),
  ...approvedRestingCatIds.map(id => scriptGroup('cat.resting-30.' + id, 'current',
    `art/cat-pixel80/resting-30/${id}.aseprite`, 'export-cat-resting-30', approvedRestingCatPath,
    pngs([approvedRestingCatPath + id], 80), { id })),
  scriptGroup('cat.ear-retouch.CE01-masks', 'current',
    'art/cat-pixel80/standing-ears-v25/CE01-inner-ear-shared.aseprite',
    'export-cat-standing-ear-masks', standingEarPath,
    pngs(withPrefix(standingEarPath, ['CE01-left-mask', 'CE01-right-mask']), 80)),
  ...approvedRestingCatIds.map(id => scriptGroup('cat.ear-retouch.CE01-' + id, 'current',
    `art/cat-pixel80/standing-ears-v25/${id}.aseprite`, 'export-cat-resting-30', standingEarPath,
    pngs([standingEarPath + id], 80), { id })),
  layerGroup('cat.body-outline.front-paw-soles', 'current', 'art/cat-pixel80/body-retouch/front-paw-soles.aseprite',
    'Front sole inner ink', frontPawSoleGuide, cat, 80),
  ...approvedRestingCatIds.map(id => scriptGroup('cat.body-outline.front-paw-stock.' + id, 'current',
    `art/cat-pixel80/front-paw-soles-v26/${id}.aseprite`, 'export-cat-resting-30', frontPawSolesPath,
    pngs([frontPawSolesPath + id], 80), { id })),
  layerGroup('cat.ear-retouch.dilute-crown-patch', 'current', 'art/cat-pixel80/dilute-ear-mark-v27/CC12.aseprite',
    'CC12 left crown - soften fur stripe', diluteEarMarkPatch, cat, 80),
  scriptGroup('cat.ear-retouch.dilute-crown-stock', 'current', 'art/cat-pixel80/dilute-ear-mark-v27/CC12.aseprite',
    'export-cat-resting-30', diluteEarMarkPath, pngs([diluteEarMarkStock], 80), { id: 'CC12' }),
  ...approvedRestingCatIds.filter(id => id !== 'li_hua').map(id =>
    scriptGroup('cat.body-outline.rear-paw-stock.' + id, 'current',
      `art/cat-pixel80/resting-v29/${id}.aseprite`, 'export-cat-resting-30', combinedRestingCatPath,
      pngs([combinedRestingCatPath + id], 80), { id })),
  ...approvedRestingCatIds.map(id => scriptGroup('cat.body-outline.resting-v30.' + id, 'current',
    `art/cat-pixel80/resting-v30/${id}.aseprite`, 'export-cat-resting-30', updatedRestingCatPath,
    pngs([updatedRestingCatPath + id], 80), { id })),
  scriptGroup('cat.body-outline.orange-stripe-resting', 'current', 'art/cat-pixel80/resting-v31/orange.aseprite',
    'export-cat-resting-30', 'cat/resting-v31/', pngs([orangeStripeRestingAsset], 80), { id: 'orange' }),
  scriptGroup('cat.body-outline.front-gloves', 'current', 'art/cat-pixel80/front-glove/front-glove.aseprite',
    'export-cat-resting-30', 'cat/front-glove/', pngs([frontGloveGuide], 80), { id: 'front-glove' }),
  scriptGroup('cat.body-outline.chin-shading', 'current', 'art/cat-pixel80/resting-v30/chin-shared-mask.aseprite',
    'export-cat-resting-30', 'cat/chin-shading/', pngs([chinShadeMask], 80), { id: 'shared' }),
  scriptGroup('cat.body-outline.shared-calico', 'current', 'art/cat-pixel80/shared-calico-body/body-index.aseprite',
    'export-cat-calico-body-index', 'cat/shared-calico-body', pngs([calicoBodyIndex], 80)),
  scriptGroup('cat.body-outline.shared', 'current', 'art/cat-pixel80/body-retouch/shared-resting-outline.aseprite',
    'export-cat-shared-outline', sharedRestingOutlinePath,
    pngs(withPrefix(sharedRestingOutlinePath, ['body', 'legs', 'leg-fur', 'cheek-fur']), 80)),
  ...Object.keys(catBreedDetailPresets).map(breed => scriptGroup('cat.body-outline.' + breed, 'current',
    `art/cat-pixel80/breed-body-outline/${breed}.aseprite`, 'export-cat-breed-body-outline', breedBodyOutlinePath,
    pngs([breedBodyOutlinePath + breed, breedBodyOutlinePath + breed + '-erase']), { breed })),
  layerGroup('cat.li-hua-coat.frenzy-mouth-fur', 'current', 'art/cat-pixel80/mouth-retouch/li-hua-frenzy-fur.aseprite',
    'Restore sampled muzzle fur', liHuaFrenzyFurAsset, cat, 80),
  ...Object.keys(catBreedDetailPresets).map(breed => {
    const path = catBreedDetailsPath + breed + '/';
    const parts = ['paws', 'paws-erase'];
    if (breed !== 'dilute-calico') parts.push('nose', 'whiskers', 'whiskers-erase', 'standing-ears');
    return scriptGroup('cat.face-edges.breed-details.' + breed, 'current', `art/cat-pixel80/breed-details/${breed}.aseprite`,
      'export-cat-breed-details', path, pngs(withPrefix(path, parts), 80));
  }),
  ...['orange', ...Object.keys(catBreedDetailPresets)].map(breed => {
    const path = catHeadCleanupPath + breed + '/';
    const parts = ['head'];
    if (['british-blue', 'american-shorthair', 'siamese', 'ragdoll'].includes(breed)) parts.push('left-standing-ear');
    if (breed === 'dilute-calico') parts.push('rear-paw', 'tail-seam');
    return scriptGroup('cat.face-edges.head-cleanup.' + breed, 'current', `art/cat-pixel80/head-cleanup/${breed}.aseprite`,
      'export-cat-speck-cleanup', path, pngs(withPrefix(path, parts)));
  }),
  scriptGroup('cat.pet-love', 'current', 'art/cat-pixel80/pet-love.aseprite',
    'export-cat-pet-love', catPetLove.path, [
      ...pngs([catPetLove.path + 'eyes']),
      { key: catPetLove.path + 'hearts',
        width: catPetLove.hearts.width * catPetLove.columns,
        height: catPetLove.hearts.height * Math.ceil(catPetLove.frames / catPetLove.columns) },
    ], { columns: catPetLove.columns, frames: catPetLove.frames, duration: catPetLove.frameDuration,
      hearts: Object.values(catPetLove.hearts).join(',') }),
  ...Object.entries(catFileActions).map(([action, { path, columns, durations, closedFrames, regions }]) =>
    scriptGroup('cat.' + action, 'current', `art/cat-shared/${action}.aseprite`,
      'export-cat-file-action', path, Object.entries(regions).map(([part, { width, height }]) => ({
        key: path + part,
        width: width * columns,
        height: height * durations.length / columns,
      })), {
        action, columns, durations: durations.join(','), closed: closedFrames.join(','),
        ...Object.fromEntries(Object.entries(regions).map(([part, region]) => [part, Object.values(region).join(',')])),
      })),
  scriptGroup('cat.typing.reference-v2.shared', 'compatibility', 'art/cat-shared/typing-v2/gentle.aseprite',
    'export-cat-typing-v2', typingV2Atlas.path, [
      ...pngs(withPrefix(typingV2Atlas.path, Object.values(sharedTypingGeometry)), CAT_SIZE, typingV2Atlas.frames),
      ...pngs(withPrefix(typingV2Atlas.path, Object.values(typingInkPatches))),
    ],
    { mode: 'shared', frames: typingV2Atlas.frames, ...sharedTypingGeometry }),
  ...(['fast', 'frenzy'] as const).map(mode => scriptGroup('cat.typing.reference-v2.' + mode, 'current',
    'art/cat-shared/typing-v2/' + mode + '.aseprite', 'export-cat-typing-v2', typingV2Atlas.path, [
      ...pngs([typingV2Atlas.path + 'sweat_' + mode], CAT_SIZE, typingV2Atlas.frames),
      ...pngs(withPrefix(typingV2Atlas.path,
        mode === 'fast' ? ['mouth_flat', 'mouth_smile', 'mouth_region'] : ['effort_eyes'])),
    ], { mode, frames: typingV2Atlas.frames })),
  layerGroup('cat.typing.laptop', 'compatibility', 'art/cat-shared/typing-laptop.aseprite', 'laptop', typingReferencePath + 'laptop'),
  scriptGroup('cat.typing.effects', 'compatibility', 'art/cat-shared/typing-effects.aseprite', 'export-cat-typing-effects',
    typingEffectPath, pngs(withPrefix(typingEffectPath, ['effort_eyes', 'orange_eye_patch', 'sweat_0', 'sweat_1', 'sweat_2']))),
  group('cat.typing.breed-laptop', 'compatibility', pngs([breedLaptop]), [], {
    ...cat, note: 'Retained original laptop used to reconstruct old saves.',
  }),
  group('cat.walk', 'compatibility', pngs(walkLayers, PET_SIZE), [], {
    ...cat, sources: ['art/cat-breeds/calico-right-walk.aseprite'], note: 'Retained exports. Walking is not a current workbench action.',
  }),
  layerGroup('cat.walk.glints', 'compatibility', 'art/cat-breeds/walk-eye-glint.aseprite',
    'walk_eye_Y01_glints', walkEyeGlints, cat, PET_SIZE),
  ...['A04', 'A05'].map(id => layerGroup('archive.accessory.' + id, 'archive',
    'art/orange-cat/accessory/' + id + '.aseprite', 'accessory', orangePath + 'accessory_' + id, archived)),
  ...legacyMouthIds.filter(id => id !== 'CN01').map(id =>
    layerGroup('archive.orange.muzzle.' + id, 'archive', 'art/orange-cat/muzzle/' + id + '.aseprite',
      'muzzle', orangePath + 'muzzle_' + id, archived)),
  group('archive.forehead.P03', 'archive', [], [], {
    sources: ['art/cat-shared/forehead/P03.aseprite'], note: 'No-pattern reference; the runtime uses a clearing mask.',
  }),
  group('archive.cat.160', 'archive', pngs(oldCatLayers, PET_SIZE)),
  group('archive.cat.hd', 'archive', pngs(withPrefix('cat/hd/new_', oldHdLayers))),
  group('archive.cat.orange-ears', 'archive', pngs([
    ...[1, 2, 3, 4].map(i => orangePath + 'ear_CE0' + i), 'cat/new_/ear_folded_320',
  ])),
  ...(['CC02', 'CC03', 'CC04'] as const).map(palette => group('archive.cat.' + palette, 'archive',
    pngs(withPrefix(breedPath(palette), ['eye_Y07_aperture', ...legacyMouthIds.map(id => 'muzzle_' + id)])),
    [], { sources: ['art/cat-breeds/' + breedArt[palette][1] + '-front.aseprite'] })),
  group('archive.dog.patterns', 'archive', pngs([
    'masks/M1_pattern_P03_s', 'parts/M1_pattern_P02', 'parts/M1_pattern_P03',
  ], PET_SIZE)),
];

export const assetFiles = new Map(assetGroups.flatMap(group => group.files.map(file => [file.key, file] as const)));
export const assetsFor = (consumer: Consumer) =>
  assetGroups.filter(group => group.consumer === consumer).flatMap(group => group.files.map(file => file.key));
