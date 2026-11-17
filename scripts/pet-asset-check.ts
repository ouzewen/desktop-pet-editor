import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { assetGroups, assetFiles, catAssetOptions, faceTiles, CAT_SIZE, type AssetFile } from '../src/pet-assets.ts';

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function checkPng(directory: string, asset: AssetFile) {
  const name = asset.key + '.png';
  const path = join(directory, name);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) throw Error('缺少 PNG · ' + name);
  const data = readFileSync(path);
  if (data.length < 33 || !data.subarray(0, 8).equals(pngSignature) || data.toString('ascii', 12, 16) !== 'IHDR') {
    throw Error('无效 PNG · ' + name);
  }
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (width !== asset.width || height !== asset.height) {
    throw Error('图层尺寸错误 · ' + name + ' (' + width + '×' + height + '，应为 ' + asset.width + '×' + asset.height + ')');
  }
}

export function pngKeys(directory: string) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(file => file.isFile() && file.name.endsWith('.png'))
    .map(file => relative(directory, join(file.parentPath, file.name)).replaceAll('\\', '/').slice(0, -4))
    .filter(key => !key.startsWith('cat/custom/'));
}

export function checkPetAssets(root: string, publicDir: string) {
  const errors = new Set<string>();
  const ids = new Set<string>();
  const seen = new Set<string>();
  const sourcePaths = new Set<string>();
  const assetDir = resolve(publicDir, 'assets');
  for (const group of assetGroups) {
    if (ids.has(group.id)) errors.add('素材组重复 · ' + group.id);
    ids.add(group.id);
    for (const source of group.sources) {
      sourcePaths.add(source);
      if (!statSync(resolve(root, source), { throwIfNoEntry: false })?.isFile()) errors.add('缺少 Aseprite 源稿 · ' + source);
    }
    for (const job of group.jobs) {
      if ('script' in job && !statSync(resolve(root, job.script), { throwIfNoEntry: false })?.isFile()) {
        errors.add('缺少导出脚本 · ' + job.script);
      }
    }
    for (const file of group.files) {
      if (seen.has(file.key)) errors.add('PNG 重复登记 · ' + file.key);
      seen.add(file.key);
      try { checkPng(assetDir, file); }
      catch (error) { errors.add(group.id + ' · ' + (error as Error).message); }
    }
  }
  for (const key of pngKeys(assetDir)) {
    if (!assetFiles.has(key)) errors.add('PNG 未登记 · ' + key + '.png');
  }
  const columns = Object.keys(catAssetOptions.nose).length;
  if (columns !== Object.keys(catAssetOptions.mouth).length || columns * faceTiles.width > CAT_SIZE) {
    errors.add('鼻子和嘴巴的选项数量与正面图集列数不匹配');
  }
  if (errors.size) throw Error('素材清单校验失败\n' + [...errors].join('\n'));
  return { groups: ids.size, files: seen.size, sources: sourcePaths.size };
}
