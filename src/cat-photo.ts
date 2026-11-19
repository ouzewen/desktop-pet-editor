import { catCoatSets } from './cat-coat-sets';
import { catPresets, readPetConfig, type CatConfig } from './cat';
import type { FurPatch } from './cat-fur-patches';

import { catBodyPigments, catChestChoices, catPhotoFeatureRegions, choices, type PhotoObservations } from './cat-photo-request';

const isChoice = <Key extends keyof typeof choices>(key: Key, value: unknown): value is PhotoObservations[Key] =>
  typeof value === 'string' && (choices[key] as readonly string[]).includes(value);

const baseFor: Partial<Record<PhotoObservations['set'], keyof typeof catPresets>> = {
  calico: 'preset_cat_calico', tortie: 'preset_cat_calico', orange: 'preset_cat_orange',
  black: 'preset_cat_black', gray: 'preset_cat_british_blue', white: 'preset_cat_british_blue',
  siamese: 'preset_cat_siamese', ragdoll: 'preset_cat_ragdoll',
};
const furWhite = '#F5EDDF';
const furDark = '#39343E';
const ringPigment = { orange: '#BC7649', silver: '#777C89', brown: '#7B4F35' };
type PatchBox = [x: number, y: number, width: number, height: number];

type Side = 'left' | 'right';
type PawRecovery = { side: Side; anatomicalSide: Side; photo: number; sourceSide: Side; feature: 'white-paw' | 'white-forearm' | 'white-leg' | 'colored' | 'distal-dark-patch' };
const opposite = (side: Side): Side => side === 'left' ? 'right' : 'left';
const pawFields = ['Paw', 'PawVisibility', 'ForelegWhiteCoverage', 'ForelegDarkPatch', 'WhiteToesOnly'] as const;

type BodyPigment = Exclude<typeof catBodyPigments[number], 'unknown'>;
type BodyMark = 'saddle' | 'flank-island' | 'hip';
const bodyColors: Record<BodyPigment, string> = { dark: furDark, orange: '#D38F5B', gray: '#777787' };
const bodyMarkBoxes: Record<BodyMark, PatchBox> = {
  saddle: [199, 193, 96, 61], 'flank-island': [211, 235, 66, 64], hip: [207, 256, 69, 54],
};
const patchCoverageScale = { small: 0.76, medium: 1, large: 1.22 } as const;
type PatchCoverage = keyof typeof patchCoverageScale;
type BodyDesign = {
  photo: number; headTail?: { head: BodyPigment; tail?: BodyPigment; crownAreas: readonly [number | undefined, number | undefined] };
  marks: { side: Side; shape: BodyMark; color: BodyPigment; coverage: PatchCoverage }[];
};
const hasBodyPigment = (value: unknown): value is BodyPigment =>
  typeof value === 'string' && Object.hasOwn(bodyColors, value);

function selectBodyDesign(input: unknown, flank: unknown, views: readonly FurEvidence[]): BodyDesign | undefined {
  const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const bodyPhoto = data.photo;
  const bodyView = typeof bodyPhoto === 'number' && Number.isInteger(bodyPhoto) ? views[bodyPhoto - 1] : undefined;
  if (bodyView && data.white === 'head-tail' && hasBodyPigment(data.head)) {
    const tail = hasBodyPigment(data.visibleTail) && (data.tail === data.visibleTail || bodyView.tailVisible === true)
      ? data.visibleTail : undefined;
    const highWhite = bodyView.torsoWhite || (bodyView.torsoVisible !== true
      && (bodyView.white ?? 0) >= 0.68 && (bodyView.orange ?? 1) < 0.025);
    if (highWhite) {
      const crownAreas = [bodyView.leftCrownLayout?.capOrange, bodyView.rightCrownLayout?.capOrange] as const;
      const warmCap = (bodyView.leftCrown === 'orange' && (crownAreas[0] ?? 0) >= 0.40)
        || (bodyView.rightCrown === 'orange' && (crownAreas[1] ?? 0) >= 0.40);
      return { photo: bodyPhoto as number, headTail: { head: warmCap ? 'orange' : data.head, tail, crownAreas }, marks: [] };
    }
  }

  if (!flank || typeof flank !== 'object') return;
  const { photo, side, location, pigment, coverage } = flank as Record<string, unknown>;
  const view = typeof photo === 'number' && Number.isInteger(photo) ? views[photo - 1] : undefined;
  if (!(view?.torsoVisible && !view.torsoWhite && view.imageLeftAnatomicalSide)
    || (side !== 'left' && side !== 'right') || !hasBodyPigment(pigment)) return;
  const shape = location === 'shoulder' ? 'saddle' : location === 'side-waist' ? 'flank-island'
    : location === 'rear-haunch' ? 'hip' : undefined;
  // The torso-only review names the cat’s anatomical side. The saved pose
  // uses the same left/right projection as the reference photo.
  const displaySide = (views[0]?.imageLeftAnatomicalSide ?? 'right') === side ? 'left' : 'right';
  return shape ? { photo: photo as number, marks: [{ side: displaySide, shape, color: pigment, coverage: coverage === 'small' || coverage === 'large' ? coverage : 'medium' }] } : undefined;
}

type CrownLayoutEvidence = { browOrange: number; capOrange?: number; eyeWhite?: number };
type FacePigment = 'black' | 'orange' | 'white';
type ChestDesign = {
  shape: Exclude<typeof catChestChoices.shape[number], 'unknown'>;
  size: Exclude<typeof catChestChoices.size[number], 'unknown'>;
  joinChin: boolean;
  photo: number;
};

const chestTemplates = {
  tuft: { shape: 'round-bib', sizes: [[61, 48], [72, 51], [83, 56]] },
  taper: { shape: 'taper', sizes: [[47, 57], [61, 71], [76, 87]] },
  bib: { shape: 'round-bib', sizes: [[68, 57], [89, 73], [113, 88]] },
  continuous: { shape: 'continuous', sizes: [[101, 75], [123, 96], [146, 114]] },
} as const;

function selectChestDesign(input: unknown, views: readonly FurEvidence[]): ChestDesign | undefined {
  if (!input || typeof input !== 'object') return;
  const { shape, size, chin, photo } = input as Record<string, unknown>;
  if (typeof photo !== 'number' || !Number.isInteger(photo) || photo < 1 || photo > views.length) return;
  const modeledView = views[photo - 1];
  const full = views.findIndex(view => view.chestExtent === 'full');
  const upper = modeledView?.chestExtent === 'upper-only' ? photo - 1
    : views.findIndex(view => view.chestExtent === 'upper-only');
  // Constrain the model's coverage to photographed fur between the shoulders,
  // independently of the white on the face, toes and the rest of the coat.
  if (full < 0 && upper >= 0) {
    return { shape: 'tuft', size: 'small', joinChin: chin === 'joined' && !views[upper]?.chestChinGap, photo: upper + 1 };
  }
  if (shape === 'none' || (views.every(view => view.chestWhite !== true && !view.chestExtent)
    && views.some(view => view.chestWhite === false && (view.dark ?? 0) >= 0.52 && (view.white ?? 1) < 0.022))) {
    return { shape: 'none', size: 'small', joinChin: false, photo };
  }
  if (typeof shape !== 'string' || !Object.hasOwn(chestTemplates, shape)) return;
  const source = shape === 'continuous' && modeledView?.chestExtent !== 'full' && full >= 0 ? full + 1 : photo;
  return {
    shape: shape as keyof typeof chestTemplates,
    size: size === 'small' || size === 'large' ? size : 'medium',
    joinChin: chin === 'joined' && !views[source - 1]?.chestChinGap,
    photo: source,
  };
}

export type FurEvidence = {
  white?: number; orange?: number; dark?: number;
  noseBlaze?: 'thin' | 'wide' | 'none';
  shortNoseBlaze?: boolean;
  faceWhiteCoverage?: 'muzzle';
  muzzleWhite?: boolean; chestWhite?: boolean; chinOnly?: boolean;
  chestExtent?: 'upper-only' | 'full'; chestChinGap?: boolean; chestDesign?: ChestDesign;
  leftFace?: FacePigment; rightFace?: FacePigment;
  leftCrown?: 'orange' | 'black'; rightCrown?: 'orange' | 'black'; crownFrontal?: boolean;
  leftCrownLayout?: CrownLayoutEvidence; rightCrownLayout?: CrownLayoutEvidence;
  calicoCrownLayout?: CatConfig['calicoCrownLayout'];
  calicoCrownTop?: CatConfig['calicoCrownTop'];
  bodyDesign?: BodyDesign;
  leftShoulderWhite?: boolean; rightShoulderWhite?: boolean;
  imageLeftAnatomicalSide?: Side;
  leftPawVisibility?: 'visible' | 'occluded'; rightPawVisibility?: 'visible' | 'occluded';
  leftPaw?: 'white' | 'colored'; rightPaw?: 'white' | 'colored';
  leftForelegWhiteCoverage?: 'forearm' | 'leg' | 'out-of-frame';
  rightForelegWhiteCoverage?: 'forearm' | 'leg' | 'out-of-frame';
  leftForelegDarkPatch?: 'distal'; rightForelegDarkPatch?: 'distal';
  leftWhiteToesOnly?: boolean; rightWhiteToesOnly?: boolean;
  warmForeleg?: 'left' | 'right';
  uprightEars?: boolean;
  tailVisible?: boolean;
  torsoVisible?: boolean; torsoWhite?: boolean;
  coatPattern?: 'striped' | 'swirled' | 'spotted' | 'solid' | 'unknown';
};

export function resolveCatPhotoViews(
  input: Record<string, unknown>, views: readonly FurEvidence[],
  individual: readonly Record<string, unknown>[] = [input],
) {
  const first = views[0] ?? {};
  const coatIndex = views.findIndex(view => typeof view.dark === 'number');
  const coat = views[coatIndex];
  const evidence: FurEvidence = { ...first };
  if (coat) {
    evidence.dark = coat.dark;
    evidence.orange = coat.orange;
    evidence.white = coat.white;
  }
  const primary = individual[0] ?? input;
  const observations: Record<string, unknown> = { ...input, cat: primary.cat === true && input.cat === true };
  for (const field of ['set', 'tone', 'texture'] as const) {
    // A joint model prediction is usable only when an individual view agrees.
    if (!individual.some(view => view.cat === true && view[field] === input[field])) observations[field] = primary[field];
  }
  for (const field of ['leftFace', 'rightFace', 'leftEye', 'rightEye', 'leftForeleg', 'rightForeleg'] as const) {
    observations[field] = primary[field];
  }
  const photo = input.featurePhotos as Record<string, unknown> | undefined;
  const sources = Object.fromEntries(Object.entries(catPhotoFeatureRegions).map(([key, region]) => {
    const index = photo?.[key];
    const reported = typeof index === 'number' && Number.isInteger(index) && index > 0 && index <= views.length ? index : null;
    const field = key === 'forehead' || key === 'muzzle' ? 'face' : key;
    const value = observations[field];
    const exactPart = key === 'forehead' ? value === 'thin-blaze' || value === 'wide-blaze'
      : key === 'muzzle' ? value === 'white-muzzle' : true;
    const sideDependent = key.startsWith('left') || key.startsWith('right');
    const candidates = individual.slice(0, sideDependent ? 1 : views.length);
    const matches = (result: Record<string, unknown> | undefined) => result?.cat === true && result[field] === value;
    const matching = exactPart && typeof value === 'string' && !['unknown', 'base'].includes(value)
      ? (reported && matches(candidates[reported - 1]) ? reported : candidates.findIndex(matches) + 1) : 0;
    return [key, { region, reported, model: matching || null, measured: null as number | null }];
  }));
  const measuredKeys = {
    forehead: 'noseBlaze', muzzle: 'muzzleWhite', leftFace: 'leftFace', rightFace: 'rightFace',
    ears: 'uprightEars', chest: 'chestWhite', tail: 'tailVisible',
  } as const;
  for (const [part, key] of Object.entries(measuredKeys)) {
    // Side-dependent geometry is expressed in the first photo's coordinates.
    const sameSide = part === 'leftFace' || part === 'rightFace';
    const index = sameSide ? (first[key] === undefined ? -1 : 0) : views.findIndex(view => view[key] !== undefined);
    if (index < 0) continue;
    sources[part]!.measured = index + 1;
    Object.assign(evidence, { [key]: views[index]![key] });
    if (part === 'muzzle') evidence.chinOnly = views[index]!.chinOnly;
  }
  const shortBridgeIndex = views.findIndex(view => view.shortNoseBlaze === true);
  if (shortBridgeIndex >= 0 && evidence.noseBlaze !== 'none') {
    evidence.shortNoseBlaze = true;
    sources.forehead!.measured = shortBridgeIndex + 1;
  }
  const chestDesign = selectChestDesign(input.chestMarking, views);
  if (chestDesign) {
    evidence.chestDesign = chestDesign;
    sources.chest!.reported = (input.chestMarking as { photo: number }).photo;
    sources.chest!.model = sources.chest!.reported;
    sources.chest!.measured = null;
    if (views[chestDesign.photo - 1]?.chestExtent) sources.chest!.measured = chestDesign.photo;
  }
  const pawRecoveries: PawRecovery[] = [];
  for (const side of ['left', 'right'] as const) {
    const region = sources[side + 'Foreleg']!;
    if (first[`${side}PawVisibility`] === 'occluded' || first[`${side}ForelegWhiteCoverage`] === 'out-of-frame') {
      region.model = null;
      observations[`${side}Foreleg`] = 'unknown';
      if (evidence.warmForeleg === side) delete evidence.warmForeleg;
      const anchor = first.imageLeftAnatomicalSide;
      if (!anchor) continue;
      for (const [index, view] of views.slice(1).entries()) {
        const viewAnchor = view.imageLeftAnatomicalSide;
        if (!viewAnchor || individual[index + 1]?.cat !== true) continue;
        const sourceSide = anchor === viewAnchor ? side : opposite(side);
        if (view[`${sourceSide}PawVisibility`] !== 'visible') continue;
        const paw = view[`${sourceSide}Paw`];
        const coverage = view[`${sourceSide}ForelegWhiteCoverage`];
        const darkPatch = view[`${sourceSide}ForelegDarkPatch`];
        if (!paw && !darkPatch) continue;
        const toesOnly = view[`${sourceSide}WhiteToesOnly`];
        const feature = darkPatch ? 'distal-dark-patch' : paw === 'colored' ? 'colored'
          : toesOnly ? 'white-paw' : coverage === 'leg' ? 'white-leg'
            : coverage === 'forearm' ? 'white-forearm' : 'white-paw';
        for (const field of pawFields) delete evidence[`${side}${field}`];
        for (const field of pawFields) {
          const value = view[`${sourceSide}${field}`];
          if (value !== undefined && value !== 'out-of-frame') Object.assign(evidence, { [`${side}${field}`]: value });
        }
        observations[`${side}Foreleg`] = feature === 'colored' ? 'plain' : 'unknown';
        const photo = index + 2;
        region.measured = photo;
        const anatomicalSide = side === 'left' ? anchor : opposite(anchor);
        pawRecoveries.push({ side, anatomicalSide, photo, sourceSide, feature });
        break;
      }
    } else if (first[`${side}Paw`] !== undefined || first[`${side}ForelegWhiteCoverage`] !== undefined
      || first[`${side}ForelegDarkPatch`] !== undefined) {
      region.measured = 1;
      if (first[`${side}Paw`] === 'white' && !first[`${side}ForelegWhiteCoverage`] && !first[`${side}WhiteToesOnly`]) {
        const anchor = first.imageLeftAnatomicalSide;
        for (const [index, view] of views.slice(1).entries()) {
          if (!anchor || !view.imageLeftAnatomicalSide || individual[index + 1]?.cat !== true) continue;
          const sourceSide = view.imageLeftAnatomicalSide === anchor ? side : opposite(side);
          if (view[`${sourceSide}PawVisibility`] !== 'visible' || view[`${sourceSide}Paw`] !== 'white'
            || view[`${sourceSide}ForelegWhiteCoverage`] !== 'leg') continue;
          const darkPatch = view[`${sourceSide}ForelegDarkPatch`];
          Object.assign(evidence, { [`${side}ForelegWhiteCoverage`]: 'leg', [`${side}ForelegDarkPatch`]: darkPatch });
          region.measured = index + 2;
          break;
        }
      }
    }
  }
  const showsWhiteShoulders = (view?: FurEvidence) => view?.chestExtent === 'full'
    && view.leftShoulderWhite && view.rightShoulderWhite;
  const chestPhotoIndex = (chestDesign?.photo ?? 1) - 1;
  const shoulderIndex = showsWhiteShoulders(views[chestPhotoIndex]) ? chestPhotoIndex : views.findIndex(showsWhiteShoulders);
  const fullWhiteForelegs = evidence.leftForelegWhiteCoverage === 'leg' && evidence.rightForelegWhiteCoverage === 'leg';
  const whiteShoulderPhoto = fullWhiteForelegs && shoulderIndex >= 0 ? shoulderIndex + 1 : undefined;
  if (whiteShoulderPhoto) {
    evidence.leftShoulderWhite = true;
    evidence.rightShoulderWhite = true;
  } else {
    delete evidence.leftShoulderWhite;
    delete evidence.rightShoulderWhite;
  }

  // Keep the crown and eye-surround observations independent. A tilted head
  // supplies a crown pair only when both pigments are seen in that same view.
  const hasSplitCrown = (view: FurEvidence) => view.imageLeftAnatomicalSide
    && view.leftCrown && view.rightCrown && view.leftCrown !== view.rightCrown;
  const frontalCrown = views.findIndex(view => view.crownFrontal && hasSplitCrown(view));
  const crownIndex = frontalCrown >= 0 ? frontalCrown : views.findIndex(hasSplitCrown);
  const crownView = views[crownIndex];
  const modeledCrown = input.crownMarking as { photo?: unknown; left?: unknown; right?: unknown } | undefined;
  let crownPhoto: number | undefined;
  if (crownView) {
    const reversed = crownView.imageLeftAnatomicalSide !== (first.imageLeftAnatomicalSide ?? 'right');
    evidence.leftCrown = reversed ? crownView.rightCrown : crownView.leftCrown;
    evidence.rightCrown = reversed ? crownView.leftCrown : crownView.rightCrown;
    crownPhoto = crownIndex + 1;
  } else if (modeledCrown?.photo === 1 && first.crownFrontal !== false
    && ((modeledCrown.left === 'orange' && modeledCrown.right === 'black')
      || (modeledCrown.left === 'black' && modeledCrown.right === 'orange'))) {
    evidence.leftCrown = modeledCrown.left;
    evidence.rightCrown = modeledCrown.right;
    crownPhoto = 1;
  } else {
    // A white face can still have a dark cap on only one observed side.
    evidence.leftCrown = first.leftCrown === 'black' ? 'black' : undefined;
    evidence.rightCrown = first.rightCrown === 'black' ? 'black' : undefined;
  }
  const layoutView = crownView ?? (crownPhoto === 1 ? first : undefined);
  if (layoutView && evidence.leftCrown && evidence.rightCrown) {
    const reversed = layoutView.imageLeftAnatomicalSide !== undefined
      && layoutView.imageLeftAnatomicalSide !== (first.imageLeftAnatomicalSide ?? 'right');
    const orangeOnLeft = (evidence.leftCrown === 'orange') !== reversed;
    const orange = orangeOnLeft ? layoutView.leftCrownLayout : layoutView.rightCrownLayout;
    const dark = orangeOnLeft ? layoutView.rightCrownLayout : layoutView.leftCrownLayout;
    if (orange) {
      // Compare warm fur high on the head to its reach above the eye.
      // Two pale lower rims distinguish a high cap from an eye patch.
      const highCap = (orange.capOrange ?? 0) - orange.browOrange >= 0.18
        && (orange.eyeWhite ?? 0) >= 0.55 && (dark?.eyeWhite ?? 0) >= 0.65;
      evidence.calicoCrownLayout = highCap ? 'high-cap' : orange.browOrange >= 0.38 ? 'eye-mask' : 'eye-streak';
      if (orange.capOrange !== undefined) {
        evidence.calicoCrownTop = highCap ? 'high-cap' : orange.capOrange >= 0.65 ? 'split' : 'dark';
      }
    }
  }
  const bodyDesign = selectBodyDesign(input.bodyMarking, input.flankMarking, views);
  if (bodyDesign) evidence.bodyDesign = bodyDesign;
  if (coat) {
    sources.set!.measured = coatIndex + 1;
    sources.tone!.measured = coatIndex + 1;
  }
  return { evidence, sources, observations, pawRecoveries, whiteShoulderPhoto, crownPhoto, bodyPhoto: bodyDesign?.photo };
}

export function appearanceFromCatPhoto(input: unknown, evidence?: FurEvidence) {
  if (!input || typeof input !== 'object') throw Error('无法读取照片特征');
  const data = input as Record<string, unknown>;
  if (data.cat !== true) throw Error('照片里没有识别到清楚的猫。请换一张光线好的猫照。');
  if (!isChoice('set', data.set)) throw Error('照片识别未给出有效花色，请重试。');
  const observation = <Key extends keyof typeof choices>(key: Key, fallback: PhotoObservations[Key]) => {
    const value = data[key];
    return isChoice(key, value) ? value : fallback;
  };
  const summary = typeof data.summary === 'string' ? data.summary.toLowerCase().slice(0, 400) : '';
  // Check strong contradictions against the model's own description before
  // mapping its enum. A black-and-white observation cannot use solid white.
  const blackAndWhite = /\bblack(?: and |[- ]and[- ]|[-/])white\b/.test(summary)
    && !/\b(?:orange|ginger|calico|tri.colou?r)\b/.test(summary);
  let set = data.set === 'white' && blackAndWhite
    ? (/white face|face (?:is )?(?:mostly|predominantly) white/.test(summary) ? 'black-cap' : 'blaze-white') : data.set;
  const mostlyDark = (evidence?.dark ?? 0) >= 0.52;
  const darkNeutral = mostlyDark && (evidence?.orange ?? 1) <= 0.055;
  const noLargeWhite = mostlyDark && (evidence?.white ?? 1) < 0.022;
  const tone = observation('tone', 'unknown');
  const mixedSets = ['calico', 'calico-mask', 'tortie'];
  const texture = evidence?.coatPattern ?? observation('texture', 'unknown');
  const stripeSet = texture === 'swirled' ? 'classic' : texture === 'spotted' ? 'spotted'
    : texture === 'striped' ? 'mackerel' : undefined;
  const striped = /\b(?:tabby|stripes?|striped|bands?|banded)\b/.test(summary)
    || observation('flank', 'unknown') === 'thin-stripes';
  const lacksOrange = (evidence?.orange ?? 1) <= 0.025 && evidence?.leftFace !== 'orange' && evidence?.rightFace !== 'orange';
  if (mixedSets.includes(set) && darkNeutral && lacksOrange && (evidence?.white ?? 0) >= 0.035
    && (evidence?.muzzleWhite === true || evidence?.chestWhite === true || evidence?.leftPaw === 'white' || evidence?.rightPaw === 'white')) {
    set = 'blaze-white';
  } else if (mixedSets.includes(set) && tone === 'orange' && (evidence?.orange ?? 0) >= 0.10
    && (evidence?.dark ?? 1) < 0.28 && evidence?.leftFace !== 'black' && evidence?.rightFace !== 'black') {
    set = 'orange';
  } else if (darkNeutral && noLargeWhite && [...mixedSets, 'orange', 'white'].includes(set)) {
    set = stripeSet ?? (striped ? 'mackerel' : 'black');
  } else if (darkNeutral && (stripeSet || striped) && (set === 'gray' || set === 'black')) {
    set = stripeSet ?? 'mackerel';
  } else if (set === 'white' && evidence && (evidence.dark ?? 0) >= 0.18 && (evidence.white ?? 1) < 0.75) {
    set = evidence.leftFace === 'white' && evidence.rightFace === 'white' ? 'black-cap' : 'blaze-white';
  }
  // A mostly white, neutral face can have a unilateral dark cap. Avoid
  // inheriting the orange face and body markings from a calico template.
  const neutralFace = mixedSets.includes(set) && tone === 'white' && lacksOrange
    && observation('face', 'unknown') === 'white-face' && (evidence?.white ?? 0) >= 0.48;
  if (neutralFace) set = 'black-cap';
  const kit = catCoatSets.find(item => item.id === set);
  const breed = kit?.breed ?? baseFor[set];
  if (!breed) throw Error('缺少对应的猫咪底板');
  const base = readPetConfig(catPresets[breed]);
  if (base.frame !== 'CAT') throw Error('此底板不是猫咪');
  const config: { -readonly [Key in keyof CatConfig]: CatConfig[Key] } = { ...base, ...kit?.fields };
  let patches = [...(kit?.patches ?? [])];

  const add = (preset: string, shape: string, box: PatchBox, color: string, flipped = false) => {
    const [x, y, width, height] = box;
    patches.push({ id: `photo-${preset}-${patches.length}`, preset, shape, x, y, width, height, color, flipped });
  };
  const drop = (...presets: string[]) => { patches = patches.filter(patch => !presets.includes(patch.preset)); };
  const isTabby = set === 'orange' || set === 'mackerel' || set === 'classic' || set === 'spotted';
  const pointed = set === 'siamese' || set === 'ragdoll';
  const solid = set === 'black' || set === 'gray' || set === 'white';
  if (isTabby && mostlyDark && set !== 'orange') {
    config.coat = 'darkTabby';
  } else if (isTabby && (tone === 'orange' || set === 'orange')) {
    config.palette = 'CC01';
    config.coat = 'native';
  } else if (isTabby && (tone === 'silver' || tone === 'gray')) {
    config.palette = 'CC06';
    config.coat = 'silver';
  }
  if (set === 'orange') {
    config.bodyBase = 'solid';
    config.bodyPattern = 'mackerel';
    config.cheekPattern = 'mackerel';
    config.tailPattern = 'mackerel';
    config.forelegPatternSource = 'separate';
    add('leftRings', 'three', [120, 238, 76, 78], ringPigment.orange);
    add('rightRings', 'three', [181, 238, 76, 78], ringPigment.orange, true);
  }
  const stripeColor = config.coat === 'darkTabby' ? '#37332F'
    : config.palette === 'CC01' ? ringPigment.orange : config.palette === 'CC06' ? ringPigment.silver : ringPigment.brown;
  patches = patches.map(patch => patch.preset.endsWith('Rings') ? { ...patch, color: stripeColor } : patch);
  if (solid) {
    config.bodyPattern = 'plain';
    config.cheekPattern = 'plain';
    config.tailPattern = 'plain';
    config.pattern = 'P03';
    config.bodyBase = 'solid';
    if (set === 'white') config.coat = 'ivory';
  }
  if (set === 'tortie') {
    config.faceBase = 'solid';
    config.bodyBase = 'solid';
    config.bodyPattern = 'plain';
    config.cheekPattern = 'plain';
    add('eye', 'angle', [117, 93, 114, 114], furDark);
    add('bodySpot', 'angle', [176, 216, 143, 110], furDark, true);
  }

  const reportedFace = observation('face', 'unknown');
  const splitCrown = mixedSets.includes(set) && evidence?.leftCrown && evidence?.rightCrown
    && evidence.leftCrown !== evidence.rightCrown;
  const coloredFace = mixedSets.includes(set) && (
    (evidence?.leftFace === 'orange' && evidence.rightFace === 'black')
    || (evidence?.leftFace === 'black' && evidence.rightFace === 'orange'));
  const sampledBlaze = evidence?.noseBlaze;
  const describedBlaze = reportedFace === 'white-muzzle' && /white (?:blaze|stripe)\b/.test(summary);
  let face = sampledBlaze === 'thin' ? 'thin-blaze' : sampledBlaze === 'wide' ? 'wide-blaze'
    : describedBlaze && sampledBlaze !== 'none' ? 'thin-blaze' : reportedFace;
  const hasWhiteBlaze = sampledBlaze === 'thin' || sampledBlaze === 'wide';
  if (!hasWhiteBlaze && (evidence?.muzzleWhite === false
    || (set === 'black' && evidence?.muzzleWhite !== true && (evidence?.white ?? 0) < 0.025))
    && (face.startsWith('white') || face.endsWith('blaze'))) face = 'none';
  if (noLargeWhite && sampledBlaze !== 'thin' && sampledBlaze !== 'wide' && face.startsWith('white')) face = 'none';
  if ((noLargeWhite || sampledBlaze === 'none') && (face === 'thin-blaze' || face === 'wide-blaze')
    && sampledBlaze !== 'thin' && sampledBlaze !== 'wide') face = noLargeWhite ? 'none' : 'white-muzzle';
  const darkEyes = mixedSets.includes(set) && evidence?.leftFace === 'black' && evidence.rightFace === 'black';
  const narrowMuzzle = evidence?.faceWhiteCoverage === 'muzzle' && evidence.muzzleWhite !== false && !noLargeWhite;
  const chinOnly = evidence?.chinOnly === true && !hasWhiteBlaze;
  if (chinOnly || narrowMuzzle || (darkEyes && sampledBlaze === 'none' && face === 'white-face')) face = 'white-muzzle';
  const cap = set === 'black-cap' ? patches.find(patch => patch.preset === 'eye' && patch.shape === 'cap') : undefined;
  if (face !== 'unknown' && face !== 'base') {
    if (!cap || face === 'none' || face === 'dark-mask' || face.endsWith('dark-eye')) drop('eye', 'blaze');
    else drop('blaze');
    if (face === 'dark-mask' && !pointed && !isTabby) add('eye', 'mask', [151, 116, 196, 87], furDark);
    if (face === 'left-dark-eye') add('eye', 'angle', [109, 104, 88, 83], furDark);
    if (face === 'right-dark-eye') add('eye', 'angle', [191, 104, 88, 83], furDark, true);
  }
  const prepaintedCrown = config.palette === 'CC03' && splitCrown;
  if (prepaintedCrown) {
    config.calicoCrown = evidence.leftCrown === 'orange' ? 'orange-left' : 'orange-right';
    config.calicoCrownLayout = evidence.calicoCrownLayout;
    config.calicoCrownTop = evidence.calicoCrownTop;
    config.faceBase = 'native';
    config.pattern = 'P00';
    config.cheekPattern = 'native';
    drop('eye', 'blaze');
  } else if (coloredFace) {
    config.faceBase = 'solid';
    config.pattern = 'P03';
    drop('eye', 'blaze');
    const darkRight = evidence.rightFace === 'black';
    add('eye', 'angle', [darkRight ? 213 : 91, 87, 128, 130], furDark, !darkRight);
    add('eye', 'angle', [darkRight ? 91 : 213, 101, 99, 90], '#CF8B56', darkRight);
  } else if (darkEyes) {
    config.faceBase = 'solid';
    config.pattern = 'P03';
    drop('eye', 'blaze');
    add('eye', 'mask', [151, 103, 191, 97], furDark);
  }
  if (prepaintedCrown) {
    if (evidence.chestDesign?.joinChin && evidence.chinOnly) add('eye', 'chin', [151, 157, 43, 24], furWhite);
  } else if (face === 'white-muzzle' || face === 'thin-blaze' || face === 'wide-blaze') {
    if (chinOnly) add('eye', 'chin', [151, 157, 43, 24], furWhite);
    else if (narrowMuzzle) add('eye', 'mask', [151, 152, 122, 36], furWhite);
    else add('eye', 'mask', [152, 145, coloredFace ? 141 : 184, 44], furWhite);
    if (hasWhiteBlaze && evidence?.shortNoseBlaze) {
      add('blaze', 'nose-tip', [151, 123, sampledBlaze === 'thin' ? 17 : 24, 34], furWhite);
    } else if (face === 'thin-blaze') {
      add('blaze', 'stripe', [151, 112, 37, 91], furWhite);
    } else if (face === 'wide-blaze') {
      add('blaze', 'vee', [151, 112, 73, 92], furWhite);
    }
  } else if (face === 'white-face') {
    add('eye', 'mask', [151, coloredFace ? 140 : 125, coloredFace ? 156 : 220, coloredFace ? 58 : 96], furWhite);
  }
  if (cap && patches.includes(cap)) {
    patches = patches.filter(patch => patch !== cap);
    patches.push(cap);
  }
  if (neutralFace && !evidence?.bodyDesign?.headTail) {
    const darkLeft = evidence?.leftCrown === 'black';
    const darkRight = evidence?.rightCrown === 'black';
    if (darkLeft !== darkRight) {
      drop('eye', 'blaze');
      config.coat = 'ivory';
      config.faceBase = 'solid';
      config.bodyBase = 'solid';
      config.bodyPattern = 'plain';
      config.cheekPattern = 'plain';
      config.pattern = 'P03';
      add('eye', 'angle', [darkLeft ? 101 : 201, 75, 94, 112], furDark, darkRight);
    }
  }
  const ears = evidence?.uprightEars ? 'upright' : observation('ears', 'unknown');
  if (ears !== 'unknown') config.ear = ears === 'folded' ? 'CE02' : ears === 'round' ? 'CE03' : 'CE01';
  const leftEye = observation('leftEye', 'unknown'), rightEye = observation('rightEye', 'unknown');
  if (leftEye !== 'unknown') config.leftEyeColor = leftEye;
  if (rightEye !== 'unknown') config.rightEyeColor = rightEye;

  const chest = noLargeWhite || evidence?.chestWhite === false ? 'plain' : observation('chest', 'unknown');
  const design = evidence?.chestDesign;
  if (design) {
    drop('chest');
    if (design.shape !== 'none') {
      const { shape, sizes } = chestTemplates[design.shape];
      const [width, height] = sizes[design.size === 'small' ? 0 : design.size === 'large' ? 2 : 1];
      // The shared white uses the same pigment for the connected chest and
      // both shoulder/foreleg surfaces. Toe-size markings stay independent.
      const whiteShoulders = design.shape === 'continuous' && evidence.leftShoulderWhite && evidence.rightShoulderWhite;
      config.whiteDistribution = whiteShoulders ? 'shoulder' : 'bib';
      const top = design.joinChin ? design.shape === 'tuft' ? 152 : 160 : 181;
      patches.push({ id: 'photo-chest-shape', preset: 'chest', shape: whiteShoulders ? 'wide-shoulders' : shape,
        x: 151, y: top + Math.floor(height / 2), width: whiteShoulders ? width + 24 : width, height, color: furWhite, flipped: false, joinChin: design.joinChin });
    }
  } else if (chest !== 'unknown' && chest !== 'base') {
    drop('chest');
    if (chest === 'small-white') add('chest', 'drop', [150, 189, 45, 37], furWhite);
    if (chest === 'white-bib') add('chest', 'bib', [151, 203, 116, 81], furWhite);
    if (chest === 'wide-white') add('chest', 'full', [151, 220, 186, 116], furWhite);
  }
  const bodyMarks = evidence?.bodyDesign?.marks;
  const headTail = evidence?.bodyDesign?.headTail;
  if (bodyMarks?.length && !isTabby && !noLargeWhite && (mixedSets.includes(set) || headTail || set === 'black-cap' || set === 'blaze-white')) {
    drop('bodySpot');
    // Insert them below the chest, so a saddle crossing an existing white bib
    // cannot erase the bright edge that ties the neck and front legs together.
    const chestPatches = patches.filter(patch => patch.preset === 'chest');
    drop('chest');
    for (const { side, shape, color, coverage } of bodyMarks) {
      const [x, y, width, height] = bodyMarkBoxes[shape];
      const scale = patchCoverageScale[coverage];
      add('bodySpot', shape, [side === 'left' ? 302 - x : x, y, Math.round(width * scale), Math.round(height * scale)],
        bodyColors[color], side === 'left');
    }
    patches.push(...chestPatches);
  }
  const flank = observation('flank', 'unknown');
  const patterns = { plain: 'plain', 'thin-stripes': 'mackerel', swirls: 'classic', spots: 'spotted' } as const;
  if (flank in patterns && (isTabby || solid) && !(flank === 'plain' && isTabby && stripeSet)) {
    config.bodyPattern = patterns[flank as keyof typeof patterns];
    config.bodyBase = 'solid';
  } else if (!patches.some(patch => patch.preset === 'bodySpot') && !isTabby && (flank === 'left-dark' || flank === 'right-dark')) {
    const right = flank === 'right-dark';
    add('bodySpot', 'angle', [right ? 207 : 96, 219, 65, 85], furDark, right);
  }

  const warmForeleg = mixedSets.includes(set) ? evidence?.warmForeleg : undefined;
  for (const side of ['left', 'right'] as const) {
    const pawTone = side === 'left' ? evidence?.leftPaw : evidence?.rightPaw;
    const right = side === 'right', forelegX = right ? 181 : 120, pawX = right ? 176 : 127;
    const observedLimb = observation(side === 'left' ? 'leftForeleg' : 'rightForeleg', 'unknown');
    const coverage = side === 'left' ? evidence?.leftForelegWhiteCoverage : evidence?.rightForelegWhiteCoverage;
    if (coverage === 'out-of-frame' || evidence?.[`${side}PawVisibility`] === 'occluded') {
      drop(side + 'Foreleg', side + 'Rings', side + 'Sock');
      continue;
    }
    const darkPatch = evidence?.[`${side}ForelegDarkPatch` as const] === 'distal';
    const toesOnly = evidence?.[`${side}WhiteToesOnly` as const] === true;
    const confirmsWhite = observedLimb.startsWith('white') || pawTone === 'white';
    const reportedLimb = darkPatch ? 'white-leg' : toesOnly ? 'white-paw' : coverage === 'leg' ? 'white-leg'
      : coverage === 'forearm' && confirmsWhite && observedLimb !== 'white-leg' ? 'white-forearm' : observedLimb;
    const limb = (pawTone === 'colored' || (noLargeWhite && pawTone !== 'white')) && reportedLimb.startsWith('white')
      ? 'plain' : pawTone === 'white' && (reportedLimb === 'unknown' || reportedLimb === 'plain')
        ? 'white-paw' : reportedLimb;
    if (!warmForeleg && (limb === 'unknown' || limb === 'base')) continue;
    drop(side + 'Foreleg', side + 'Rings', side + 'Sock');
    if (warmForeleg && limb !== 'white-leg' && limb !== 'white-forearm') {
      add(side + 'Foreleg', 'long', [forelegX, 237, 76, 112], side === warmForeleg ? '#AF7551' : furDark, right);
    }
    if (limb === 'rings') {
      config.forelegPatternSource = 'separate';
      add(side + 'Rings', 'three', [forelegX, 238, 76, 78], stripeColor, right);
    } else if (limb === 'white-leg') {
      add(side + 'Foreleg', 'long', [forelegX, 237, 76, 112], furWhite);
      if (darkPatch) add(side + 'Foreleg', 'tapered', [pawX, 253, 45, 39], furDark, right);
    } else if (limb === 'white-forearm') {
      add(side + 'Foreleg', 'long', [forelegX, 248, 76, 90], furWhite);
    } else if (limb === 'white-paw' || limb === 'white-sock') {
      add(side + 'Sock', 'rounded', [pawX, limb === 'white-paw' ? 279 : 272, 58, limb === 'white-paw' ? 21 : 44], furWhite);
    }
  }

  const tail = evidence?.tailVisible === false ? 'solid' : observation('tail', 'unknown');
  if (tail === 'short') config.tail = 'CT06';
  if (tail === 'solid') config.tailPattern = 'plain';
  if (tail === 'ringed') config.tailPattern = 'mackerel';
  if (tail === 'wide-rings') config.tailPattern = 'classic';
  if (tail === 'spotted') config.tailPattern = 'spotted';

  if (headTail) {
    config.palette = 'CC02';
    config.coat = 'ivory';
    config.bodyBase = 'solid';
    config.bodyPattern = 'plain';
    config.cheekPattern = 'plain';
    config.forelegPatternSource = 'separate';
    config.pattern = 'P03';
    config.faceBase = 'native';
    config.coloredTail = headTail.tail;
    config.whiteDistribution = 'head-tail';
    config.tail = config.tail === 'CT01' ? 'CT05' : config.tail;
    delete config.calicoCrown;
    delete config.calicoCrownLayout;
    delete config.calicoCrownTop;
    drop('eye', 'blaze', 'chest', 'leftForeleg', 'rightForeleg', 'leftRings', 'rightRings', 'leftSock', 'rightSock');
    const [leftArea, rightArea] = headTail.crownAreas;
    if (headTail.head === 'orange' && (evidence?.orange ?? 1) < 0.15) {
      for (const [side, area] of [['left', leftArea], ['right', rightArea]] as const) {
        if (area !== undefined && area < 0.10) continue;
        const coverage = (area ?? 0.35) < 0.45 ? 'small' : 'medium';
        const scale = patchCoverageScale[coverage];
        const left = side === 'left';
        add('eye', 'ear-tip', [left ? 91 : 211, 42, Math.round(62 * scale), Math.round(54 * scale)], bodyColors.orange, !left);
      }
    } else {
      add('eye', 'cap', [151, 55, 179, 72], bodyColors[headTail.head]);
    }
  }

  // The same validated config drives all live poses and editing.
  const chosen = readPetConfig({ ...config, furPatches: patches });
  const preset = config.palette === 'CC01' ? 'preset_cat_orange' : config.palette === 'CC06' ? 'preset_cat_american_shorthair' : breed;
  const setName = headTail ? headTail.tail ? '白底有色头尾' : '白底色帽' : set === 'blaze-white' && sampledBlaze === 'none' ? '黑白双色' : kit?.name ?? base.name;
  return { config: chosen, breed: preset, setName };
}

export function appearanceFromCatPhotoViews(
  input: Record<string, unknown>, views: readonly FurEvidence[],
  individual: readonly Record<string, unknown>[], coatPattern?: FurEvidence['coatPattern'],
) {
  const resolved = resolveCatPhotoViews(input, views, individual.length ? individual : [input]);
  if (coatPattern) resolved.evidence.coatPattern = coatPattern;
  return { ...appearanceFromCatPhoto(resolved.observations, resolved.evidence), ...resolved };
}
