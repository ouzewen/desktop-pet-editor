// The built-in art contract shared by the renderer, build and Aseprite exporter.
// Paths in files are relative to public/assets, without the PNG extension.
export const PET_SIZE = 160;
export const CAT_SIZE = 320;
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
export const breedEyeGlints = 'cat/hd/breeds/eye_glints';
export const facePartsPath = 'cat/hd/face-parts/';
export const catNosePath = facePartsPath + 'noses/';
export const catMouthPath = facePartsPath + 'mouths/';
export const mouthSkinPath = catMouthPath + 'skin_cleanup';
export const mouthSkinColumns = 4;
export const legacyNoseOutlinePath = facePartsPath + 'legacy_nose_outline';
export const bodyPatternPath = 'cat/hd/body-patterns/';
export const headPatternPath = 'cat/hd/head-patterns/';
export const earMaskPath = 'cat/hd/ear-masks/';
export const tailPath = 'cat/hd/tails/';
export const initialTailPath = tailPath + 'initial/';
export const referenceTailPath = tailPath + 'reference/';
export const typingEffectPath = 'cat/hd/typing-effects/';
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
const currentTypingAtlas = typingAtlases['reference-v2'];
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

export const assetGroups: readonly AssetGroup[] = [
  group('dog.m1', 'compatibility', pngs(dogLayers, PET_SIZE), [], {
    consumer: 'dog', sources: [], note: 'Retained PNGs for the standalone Web editor and native fallback.',
  }),
  group('cat.orange.base', 'current', pngs(withPrefix(orangePath, ['body', 'head_base', 'iris'])), [], {
    consumer: 'cat', sources: ['orange_cat.aseprite'], note: 'Original reference source; the refined head and iris PNGs are retained.',
  }),
  ...earShapes.map(shape => layerGroup('cat.ear.' + shape, 'current',
    'art/orange-cat/ears/' + shape + '.aseprite', 'ears', orangePath + 'ear_' + shape)),
  ...Object.keys(orangeAccessoryOptions).filter(id => id !== 'A00').map(id =>
    layerGroup('cat.accessory.' + id, 'current', 'art/orange-cat/accessory/' + id + '.aseprite', 'accessory', orangePath + 'accessory_' + id)),
  ...frontFaceMarkings.map(name => layerGroup('cat.orange.' + name, 'compatibility',
    'art/orange-cat/face/' + name.slice(5) + '.aseprite', 'face', orangePath + name)),
  ...oldModes.map(mode => scriptGroup('cat.orange.typing.' + mode, 'compatibility',
    'art/orange-cat/typing/' + mode + '.aseprite', 'export-orange-typing', 'cat/new_',
    pngs(withPrefix(orangePath, [...olderTyping(mode), ...(mode === 'gentle' ? ['typing_laptop'] : [])])), { mode })),
  group('cat.eye-glints', 'current', pngs([orangePath + 'eye_glints', breedEyeGlints]), [
    { source: 'art/cat-breeds/eye-glints.aseprite', layer: 'CAT_eye_glints', output: orangePath + 'eye_glints' },
    { source: 'art/cat-breeds/eye-glints.aseprite', layer: 'breed_eye_glints', output: breedEyeGlints },
  ], cat),
  scriptGroup('cat.ear-masks', 'current', 'art/cat-shared/front-ear-masks.aseprite', 'export-cat-ear-masks',
    earMaskPath, pngs(withPrefix(earMaskPath, alternativeEars))),
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
  scriptGroup('cat.typing.reference-v2.shared', 'current', 'art/cat-shared/typing-v2/gentle.aseprite',
    'export-cat-typing-v2', currentTypingAtlas.path, [
      ...pngs(withPrefix(currentTypingAtlas.path, Object.values(sharedTypingGeometry)), CAT_SIZE, currentTypingAtlas.frames),
      ...pngs(withPrefix(currentTypingAtlas.path, Object.values(typingInkPatches))),
    ],
    { mode: 'shared', frames: currentTypingAtlas.frames, ...sharedTypingGeometry }),
  ...(['fast', 'frenzy'] as const).map(mode => scriptGroup('cat.typing.reference-v2.' + mode, 'current',
    'art/cat-shared/typing-v2/' + mode + '.aseprite', 'export-cat-typing-v2', currentTypingAtlas.path, [
      ...pngs([currentTypingAtlas.path + 'sweat_' + mode], CAT_SIZE, currentTypingAtlas.frames),
      ...pngs(withPrefix(currentTypingAtlas.path,
        mode === 'fast' ? ['mouth_flat', 'mouth_smile', 'mouth_region'] : ['effort_eyes'])),
    ], { mode, frames: currentTypingAtlas.frames })),
  layerGroup('cat.typing.laptop', 'current', 'art/cat-shared/typing-laptop.aseprite', 'laptop', typingReferencePath + 'laptop'),
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
