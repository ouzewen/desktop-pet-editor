import { catOptions, catPresets, readPetConfig, type CatConfig } from './cat';
import { appearanceFromCatPhoto } from './cat-photo';
import { calicoCrownLayouts, catPhotoParts, catAccessoryOptions, orangeAccessoryOptions } from './pet-assets';
import { makeLayer, render } from './render';

export function checkPixel80Parts() {
  const { canvas, ctx } = makeLayer(320);
  const configList: CatConfig[] = Object.values(catPresets);
  let mixedCases = 0;
  let photoCases = 0;

  function draw(config: CatConfig, action: 'sit' | 'typing', frame: number) {
    render(canvas, readPetConfig(config), action, frame, undefined, {typingMode: 'gentle'});
    if (canvas.title) throw Error(canvas.title);
    const pixels = ctx.getImageData(0, 0, 320, 320).data;
    let opaque = 0;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      if (pixels[offset] === 255) opaque++;
    }
    if (opaque < 2200) throw Error('素材被裁空 · ' + config.name);
    return pixels;
  }

  function compare(config: CatConfig, variant: CatConfig, label: string) {
    const previous = draw(config, 'sit', 0);
    const changed = draw(variant, 'sit', 0);
    if (previous.every((value, index) => value === changed[index])) {
      throw Error('部件没有实际显示 · ' + label + ' · ' + config.name);
    }
    draw(variant, 'typing', 3);
    draw(variant, 'typing', 11);
  }

  for (const config of configList) {
    for (const ear of Object.keys(catOptions.ear) as CatConfig['ear'][]) {
      if (ear === config.ear) continue;
      compare(config, {...config, ear}, ear);
      mixedCases++;
    }
    for (const tail of Object.keys(catOptions.tail) as CatConfig['tail'][]) {
      if (tail === config.tail) continue;
      compare(config, {...config, tail}, tail);
      mixedCases++;
    }
    const options = config.palette === 'CC01' ? orangeAccessoryOptions : catAccessoryOptions;
    for (const accessory of Object.keys(options) as CatConfig['accessory'][]) {
      if (accessory === 'A00') continue;
      compare(config, {...config, accessory}, accessory);
      mixedCases++;
    }
  }

  type PhotoPart = keyof typeof catPhotoParts;
  const black: CatConfig = {...catPresets.preset_cat_black, coat: 'native'};
  const orange: CatConfig = catPresets.preset_cat_orange;
  const calico: CatConfig = catPresets.preset_cat_calico;
  for (const id of Object.keys(catPhotoParts) as PhotoPart[]) {
    const part = catPhotoParts[id];
    const base = part.palette === 'CC02' ? black : part.palette === 'CC03' ? calico : orange;
    const config = 'coat' in part ? {...base, coat: part.coat} : base;
    const selected = readPetConfig({
      ...config, photoCoatParts: [id], photoEarColors: {left: 'dark', right: 'gray'},
    });
    if (selected.frame !== 'CAT' || !selected.photoCoatParts?.includes(id)) {
      throw Error('照片部件无法选用 · ' + id);
    }
    compare(config, selected, id);
    photoCases++;
  }

  for (const calicoCrown of ['orange-left','orange-right'] as const) {
    for (const calicoCrownLayout of calicoCrownLayouts) {
      compare(calico, {...calico, calicoCrown, calicoCrownLayout}, calicoCrownLayout + '/' + calicoCrown);
      photoCases++;
    }
  }
  const patchBlend = {...calico, calicoCrown: 'orange-left', calicoCrownLayout: 'eye-mask', calicoCrownTop: 'dark'} as const;
  compare(patchBlend, {...patchBlend, calicoFaceFinish: 'h3r3'}, '额眼接缝修整');
  photoCases++;

  const recognized = appearanceFromCatPhoto({
    cat: true, set: 'orange', ears: 'upright', leftForeleg: 'white-leg',
    leftEarZone: 'crown', leftEarReach: 'root', leftEarPigment: 'dark',
    rightEarZone: 'perimeter', rightEarReach: 'middle', rightEarPigment: 'gray',
  }).config;
  if (recognized.frame !== 'CAT' || !recognized.photoCoatParts?.includes('ear-left-crown-root')
    || !recognized.photoCoatParts.includes('ear-right-perimeter-middle')
    || !recognized.furPatches?.some(patch => patch.preset === 'leftForeleg')) {
    throw Error('照片特征未命中预绘耳斑');
  }
  const samples = [
    {title: '卷耳 · Z 形尾 · 蝴蝶结', config: {...orange, ear: 'CE05', tail: 'CT08', accessory: 'A01'}},
    {title: '圆耳 · 卷环尾 · 小鱼帽', config: {...catPresets.preset_cat_british_blue, ear: 'CE03', tail: 'CT09', accessory: 'A02'}},
    {title: '折耳 · 短尾 · 鸭舌帽', config: {...configList.find(config => config.palette === 'CC09')!, ear: 'CE02', tail: 'CT06', accessory: 'A07'}},
    {title: '垂耳 · L 形尾 · 星星发卡', config: {...calico, ear: 'CE04', tail: 'CT07', accessory: 'A03'}},
    {title: '照片特征 · 双侧耳斑与白前肢', config: recognized},
    {title: '照片花色 · 小白下巴与小白胸', config: {...black, photoCoatParts: ['ink-black', 'chin-small', 'chest-small']}},
    {title: '照片花色 · 三花额眼与宽白胸', config: {...patchBlend, calicoFaceFinish: 'h3r3', photoCoatParts: ['calico-wide-chest']}},
    {title: '照片花色 · 白底非对称深额斑', config: {...black, coat: 'ivory', bodyBase: 'solid', bodyPattern: 'plain', cheekPattern: 'plain', photoCoatParts: ['asymmetric-dark-crown']}},
  ] satisfies { title: string; config: CatConfig }[];

  const capture = (config: CatConfig, action: 'sit' | 'typing', frame: number) => {
    draw(config, action, frame);
    return canvas.toDataURL('image/png');
  };
  const images = samples.map(({title, config}) => ({
    title,
    idle: capture(config, 'sit', 0),
    typing: capture(config, 'typing', 3),
  }));
  return {mixedCases, photoCases, images};
}
