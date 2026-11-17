import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const { module: { assetGroups } } = await runnerImport(join(root, 'src/pet-assets.ts'));
const { module: { checkPetAssets, checkPng, pngKeys } } = await runnerImport(join(root, 'scripts/pet-asset-check.ts'));
const publicDir = join(root, 'public');
const [command, groupId, flag, output] = process.argv.slice(2);

function exportGroup(group, destination) {
  if (!group.jobs.length) throw Error(group.id + ' 没有可执行的导出流程，请保留已登记的 PNG');
  const stage = mkdtempSync(join(tmpdir(), 'pet-assets-'));
  try {
    for (const job of group.jobs) {
      const layer = 'layer' in job;
      const script = layer ? 'scripts/export-asset-layer.lua' : job.script;
      const args = layer
        ? { layer: job.layer, frame: job.frame ?? 1, file: join(stage, job.output + '.png') }
        : { output: join(stage, job.outputDir), ...job.args };
      mkdirSync(layer ? dirname(args.file) : args.output, { recursive: true });
      if (!layer) {
        for (const [name, key] of Object.entries(job.outputArgs ?? {})) {
          args[name] = join(stage, key + '.png');
          mkdirSync(dirname(args[name]), { recursive: true });
        }
      }
      const parameters = Object.entries(args).flatMap(([key, value]) => ['--script-param', key + '=' + value]);
      const result = spawnSync(process.env.ASEPRITE_BIN || 'aseprite',
        ['-b', join(root, job.source), ...parameters, '--script', join(root, script)], { stdio: 'inherit' });
      if (result.error) throw Error('无法运行 Aseprite，请检查 ASEPRITE_BIN · ' + result.error.message);
      if (result.status !== 0) throw Error('导出失败 · ' + job.source);
    }
    for (const file of group.files) checkPng(stage, file);
    const expected = new Set(group.files.map(file => file.key));
    const extra = pngKeys(stage).filter(key => !expected.has(key));
    if (extra.length) throw Error('导出了未登记的 PNG · ' + extra.join(', '));
    // Publish only after all outputs are present and have the correct dimensions.
    for (const key of expected) {
      const filename = key + '.png';
      const target = join(destination, filename);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(stage, filename), target);
    }
    console.log('已导出 ' + group.id + ' · ' + expected.size + ' 张 PNG · ' + destination);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

try {
  const group = groupId && assetGroups.find(item => item.id === groupId);
  if (groupId && !group) throw Error('未知素材组 · ' + groupId);
  switch (command) {
  case 'check': {
    const { groups, files, sources } = checkPetAssets(root, publicDir);
    console.log('素材清单校验通过 · ' + groups + ' 组 · ' + files + ' 张 PNG · ' + sources + ' 份 Aseprite 源稿');
    break;
  }
  case 'list':
    if (group) console.log(JSON.stringify(group, null, 2));
    else for (const item of assetGroups) {
      console.log([item.id, item.usage, item.files.length + ' PNG', item.jobs.length ? 'exportable' : 'retained'].join('\t'));
    }
    break;
  case 'export':
    if (!group || (flag && (flag !== '--out' || !output))) throw Error('用法 · npm run assets:export -- <素材组> [--out <assets 目录>]');
    exportGroup(group, output ? resolve(output) : join(publicDir, 'assets'));
    break;
  default:
    throw Error('用法 · npm run assets:check / assets:list / assets:export');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
