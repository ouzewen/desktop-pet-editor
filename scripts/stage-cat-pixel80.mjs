import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const { module: art } = await runnerImport(join(root, 'src/pet-assets.ts'));
const { module: { checkPng } } = await runnerImport(join(root, 'scripts/pet-asset-check.ts'));
const stage = join(root, 'output/cat-pixel80');
const source = join(root, 'art/cat-pixel80');
const only = process.argv[2];
const eyeCleanup = art.typingEffectPath + 'orange_eye_patch';
const blinkEyes = /\/eye_Y02$/;
const groups = art.assetGroups.filter(group => (group.usage === 'current' && group.consumer === 'cat')
  || (group.usage === 'compatibility' && group.consumer === 'cat'
    && group.files.some(file => file.key === eyeCleanup || blinkEyes.test(file.key))));
if (only && !groups.some(group => group.id === only)) throw Error('未知的现役素材组 · ' + only);

const orange = art.orangePath;
const typing = art.frontTyping.path;
const pilot = new Map([
  [orange + 'body', ['orange-front', 'body']],
  [orange + 'head_base', ['orange-front', 'head']],
  [orange + 'ear_upright', ['orange-front', 'ears']],
  [orange + 'iris', ['orange-front', 'iris']],
  [orange + 'eye_glints', ['orange-front', 'eye_glints']],
  [eyeCleanup, ['orange-front', 'typing_eye_cleanup']],
  [art.tailPath + 'idle_remove', ['orange-front', 'tail_removal']],
  [art.tailPath + 'idle_CT05', ['orange-front', 'tail']],
  [art.tailPath + 'idle_CT05_patterns', ['orange-front', 'tail_pattern_mask']],
  [art.catNosePath + 'NO05', ['orange-front', 'nose']],
  [art.mouthSkinPath, ['cat.mouth-skin', 'skin_cleanup']],
  [art.catMouthPath + 'CN08', ['orange-front', 'smile']],
  [typing + 'laptop', ['typing-gentle', 'laptop+paw_badge']],
  [typing + 'paws', ['typing-gentle', 'paws']],
  [art.frontTypingEffectsPath + 'gentle', ['typing-gentle', 'falling_letters']],
  [art.catShredder.path + 'props', ['cat.shredder', 'props+feed_paper+paper_strips+vibration']],
  [art.catFileActions.zip.path + 'props', ['cat.zip', 'props+papers+motion_marks+zipper']],
  [art.catFileActions.convert.path + 'props', ['cat.convert', 'props+incoming_file+finished_file+slot_edges+indicator']],
]);

const still = { x: 0, y: 0, width: 320, height: 320, columns: 1, frames: 1 };
const layouts = new Map();
for (const [name, frames] of [['paws', art.frontTyping.pawFrames], ['letters', art.frontTyping.frames]]) {
  layouts.set(typing + name, { ...art.frontTyping.region, columns: art.frontTyping.columns, frames });
}
for (const [name, region] of Object.entries(art.frontTypingEffects)) {
  layouts.set(art.frontTypingEffectsPath + name, { ...region, columns: art.frontTyping.columns });
}
function addAnimation(action, frames, durations) {
  for (const [name, region] of Object.entries(action.regions)) {
    layouts.set(action.path + name, { ...region, columns: action.columns, frames, durations });
  }
}
addAnimation(art.catListening, art.catListening.frames, [art.catListening.frameDuration]);
for (const action of Object.values(art.catFileActions)) {
  addAnimation(action, action.durations.length, action.durations);
}

function contract(file) {
  const { key, width, height } = file;
  if (key === art.mouthSkinPath) {
    return { ...art.faceTiles, x: art.faceTiles.left, y: art.faceTiles.top,
      columns: art.mouthSkinColumns, frames: Object.keys(art.breedArt).length };
  }
  if (/^cat\/hd\/face-parts\/CC\d+$/.test(key)) {
    return { ...art.faceTiles, x: art.faceTiles.left, y: art.faceTiles.top, columns: 4, frames: 12 };
  }
  if (/\/typing-v2\/sweat_/.test(key)) {
    return { ...still, frames: art.typingAtlases['reference-v2'].frames };
  }
  const region = layouts.get(key) ?? still;
  if (region.width * region.columns !== width
    || region.height * Math.ceil(region.frames / region.columns) !== height) {
    throw Error('未登记图集坐标 · ' + key);
  }
  return region;
}

const rows = [];
const files = [];
const nativeGroups = [];
for (const group of groups) {
  if (only && group.id !== only) continue;
  // This animation was authored on the native grid; reuse its exact exporter.
  if (group.id === 'cat.pet-love') {
    nativeGroups.push(group);
    files.push(...group.files);
    continue;
  }
  for (const file of group.files) {
    const { key, width, height } = file;
    if (group.usage !== 'current' && key !== eyeCleanup && !blinkEyes.test(key)) continue;
    const [document, layer] = pilot.get(key) ?? [group.id, key.split('/').at(-1)];
    const { x, y, width: cellWidth, height: cellHeight, columns, frames, durations } = contract(file);
    const detail = /mouths|noses|glint|\/sweat_|effort_eyes|typing-falling|closed_eyes|\/typing-front\/(paws|letters)/.test(key)
      || blinkEyes.test(key);
    rows.push([document, layer, key, width, height, x, y, cellWidth, cellHeight,
      columns, frames, detail ? 4 : 8, durations?.join(',') ?? '100'].join('\t'));
    files.push(file);
  }
}
const temporary = mkdtempSync(join(tmpdir(), 'cat-pixel80-'));
try {
  const manifest = join(temporary, 'art.tsv');
  writeFileSync(manifest, rows.join('\n') + '\n');
  mkdirSync(stage, { recursive: true });
  mkdirSync(source, { recursive: true });
  const heatKey = art.frontTypingEffectsPath + 'heat';
  const heat = art.frontTypingEffects.heat;
  const heatArgs = !only || only === 'cat.typing.front-v4.frenzy'
    ? ['--script-param', 'heat=' + [heatKey, heat.x, heat.y, heat.width, heat.height,
      art.frontTyping.columns, heat.frames].join(',')]
    : [];
  if (rows.length) {
    const result = spawnSync(process.env.ASEPRITE_BIN || 'aseprite', [
      '-b', '--script-param', 'root=' + root, '--script-param', 'manifest=' + manifest, ...heatArgs,
      '--script', join(root, 'scripts/stage-cat-pixel80.lua'),
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error('Aseprite 导出失败');
  }
  for (const group of nativeGroups) {
    const result = spawnSync(process.execPath, [
      join(root, 'scripts/pet-assets-cli.mjs'), 'export', group.id, '--out', join(stage, 'assets'),
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error('原生图层导出失败 · ' + group.id);
  }
  for (const file of files) checkPng(join(stage, 'assets'), file);
  console.log('已校验 ' + files.length + ' 张暂存 PNG · ' + stage);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
