import { createServer } from 'node:http';
import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { catPhotoPartPath, catPhotoParts, catPhotoPartTaxonomy } from '../../src/pet-assets.ts';
import { validateRetouches } from './retouch-data.js';

const app = dirname(fileURLToPath(import.meta.url));
const root = resolve(app, '../..');
const roundFile = resolve(process.argv[2] ?? resolve(app, 'round-16.json'));
const round = JSON.parse(await readFile(roundFile, 'utf8'));
const output = resolve(process.argv[3] ?? resolve(root, 'output', `coat-review-${round.id}-feedback.json`));
const port = Number(process.env.COAT_REVIEW_PORT ?? 4179);
const origin = `http://127.0.0.1:${port}`;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.aseprite': 'application/octet-stream',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};
const files = new Map([
  ['/', resolve(app, 'index.html')],
  ['/library', resolve(app, 'library.html')],
  ['/combinations', resolve(app, 'combination-study.html')],
  ['/library.css', resolve(app, 'library.css')],
  ['/library.js', resolve(app, 'library.js')],
  ['/review.css', resolve(app, 'review.css')],
  ['/review.js', resolve(app, 'review.js')],
  ['/retouch.js', resolve(app, 'retouch.js')],
  ['/retouch-data.js', resolve(app, 'retouch-data.js')],
]);
const studyDir = resolve(root, 'output/coat-combination-study');
const studyRows = JSON.parse(await readFile(resolve(studyDir, 'combinations.json'), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '[]';
  throw error;
}));
for (const { file } of studyRows) {
  if (/^F[1-3]-E[01]-[LR]-C[12]\.png$/.test(file)) files.set('/study/' + file, resolve(studyDir, file));
}
files.set('/study/grid.png', resolve(studyDir, '24种花色组合.png'));
files.set('/study/component-windows.png', resolve(studyDir, '正面待机-组件分区与坐标.png'));
files.set('/study/edge-comparison.png', resolve(studyDir, 'edge-candidates/脸颊与胸口-边缘对照.png'));
files.set('/study/head-map.png', resolve(studyDir, '正面待机分区-头部.png'));
files.set('/study/body-map.png', resolve(studyDir, '正面待机分区-身体.png'));
files.set('/study/overlap-map.png', resolve(studyDir, '细分部位与重叠区.png'));
files.set('/study/edge-refinement.png', resolve(studyDir, 'edge-refinement/轮廓再收顺-对照.png'));
for (const name of ['match-chioggia.png', 'match-ginger.png', 'match-calico.png', 'cat-coat-combination-study.aseprite']) {
  files.set('/study/' + name, resolve(studyDir, name));
}

const earPhotoStudy = resolve(root, 'output/cat-photo-ear-validation');
const earPhotoFiles = await readdir(earPhotoStudy).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
if (earPhotoFiles.includes('index.html')) {
  files.set('/ear-photo-test', resolve(earPhotoStudy, 'index.html'));
  for (const file of earPhotoFiles) {
    if (/^\d{2}-(source\.jpg|sit\.png|typing\.png|motion\.webp)$/.test(file)) {
      files.set('/ear-photo-test/' + file, resolve(earPhotoStudy, file));
    }
  }
}

const imageUrl = (id, path) => {
  const file = resolve(root, path);
  if (!file.startsWith(resolve(root, 'output') + sep) || !['.png', '.webp', '.jpg', '.jpeg'].includes(extname(file))) {
    throw new Error(`Invalid review image path: ${path}`);
  }
  const url = `/images/${encodeURIComponent(id)}`;
  files.set(url, file);
  return url;
};
const clientRound = {
  ...round,
  groups: round.groups.map(group => ({
    ...group,
    reference: imageUrl(`${group.id}-reference`, group.reference),
    ...(group.detail && { detail: imageUrl(`${group.id}-detail`, group.detail) }),
    options: group.options.map(option => ({
      ...option,
      image: imageUrl(`${group.id}-${option.id}`, option.image),
      ...(option.typing && { typing: imageUrl(`${group.id}-${option.id}-typing`, option.typing) }),
      ...(option.motion && { motion: imageUrl(`${group.id}-${option.id}-motion`, option.motion) }),
      ...(option.retouchFrames && { retouchFrames: imageUrl(`${group.id}-${option.id}-retouch-frames`, option.retouchFrames) }),
    })),
  })),
};

const libraryData = JSON.parse(await readFile(resolve(app, 'library.json'), 'utf8'));
function sourceLink(file) {
  if (!/^[a-z0-9-]+\.aseprite$/.test(file)) throw new Error('Invalid Aseprite source');
  const path = '/library/sources/' + file;
  files.set(path, resolve(root, 'art/cat-shared/photo-coat-parts', file));
  return path;
}
const library = {
  taxonomy: catPhotoPartTaxonomy,
  portraits: libraryData.portraits.map(portrait => ({
    ...portrait,
    preview: imageUrl('portrait-' + portrait.id, portrait.preview),
    typing: imageUrl('portrait-' + portrait.id + '-typing', portrait.typing),
  })),
  components: [...Object.entries(catPhotoParts).map(([id, part]) => {
    const labels = 'placement' in part ? {
      label: `${part.side === 'left' ? '左耳' : '右耳'} · ${part.placement === 'crown' ? '靠头顶' : '靠外轮廓'}`,
      variant: { tip: '短耳尖', middle: '半耳弧边', root: '满耳到根' }[part.coverage],
    } : libraryData.components[id];
    const url = '/library/parts/' + id + '.png';
    if (part.format === 'png') files.set(url, resolve(root, 'public/assets', catPhotoPartPath, id + '.png'));
    return {
      ...part, id, label: labels?.label ?? id, variant: labels?.variant,
      preview: part.format === 'png' ? url : labels?.preview ? imageUrl('component-' + id, labels.preview) : null,
      file: part.source, source: sourceLink(part.source),
    };
  }), ...(libraryData.studioComponents ?? []).map(({ source, preview, ...part }) => ({
    ...part, file: source, source: sourceLink(source), preview: imageUrl('component-' + part.id, preview),
  }))],
};

async function savedReview() {
  try { return JSON.parse(await readFile(output, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function readReview(request) {
  let size = 0;
  const chunks = [];
  const limit = (round.retouch || round.groups.some(group => group.retouch)) ? 1_000_000 : 48_000;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error('反馈内容过长。');
    chunks.push(chunk);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (data?.round !== round.id || !data.groups || typeof data.groups !== 'object') throw new Error('评审轮次不匹配。');
  const groups = round.groups.map(group => {
    const entry = data.groups[group.id];
    const rejected = entry?.choice === 'reject';
    const choices = entry?.choices === undefined
      ? group.options.filter(option => option.id === entry?.choice).map(option => option.id) : entry.choices;
    if (!Array.isArray(choices) || choices.length > group.options.length
      || new Set(choices).size !== choices.length || (rejected && choices.length)
      || choices.some(id => !group.options.some(option => option.id === id))) {
      throw new Error(`「${group.label}」的候选选择无效。`);
    }
    const selected = group.options.filter(option => choices.includes(option.id));
    const feedback = typeof entry?.feedback === 'string' ? entry.feedback.trim() : '';
    const retouches = validateRetouches(entry?.retouches, group.retouch ?? round.retouch, group.options);
    const hasRetouch = Object.keys(retouches).length > 0;
    if (!rejected && !selected.length && !hasRetouch) throw new Error(`请完成「${group.label}」。`);
    if (rejected && !feedback && !hasRetouch) throw new Error(`请为「${group.label}」填写修改意见。`);
    if (feedback.length > 1000) throw new Error('每组意见最多 1000 字。');
    const single = selected.length === 1 ? selected[0] : null;
    return { id: group.id, label: group.label, choice: rejected ? 'reject' : single?.id ?? null,
      selectedLabel: single?.label ?? null, choices: selected.map(option => option.id),
      selectedLabels: selected.map(option => option.label), feedback,
      ...(hasRetouch && { retouches }) };
  });
  const note = typeof data.note === 'string' ? data.note.trim() : '';
  if (note.length > 1500) throw new Error('整体意见最多 1500 字。');
  return { round: round.id, submittedAt: new Date().toISOString(), groups, note };
}

createServer(async (request, response) => {
  try {
    const path = new URL(request.url, origin).pathname;
    if (request.method === 'GET' && path === '/api/library') return json(response, 200, library);
    if (request.method === 'GET' && path === '/api/review') {
      return json(response, 200, { round: clientRound, saved: await savedReview() });
    }
    if (request.method === 'POST' && path === '/api/review') {
      if (request.headers.origin !== origin || request.headers['content-type']?.split(';')[0] !== 'application/json') {
        return json(response, 403, { error: '请在本地评审页面提交。' });
      }
      let review;
      try { review = await readReview(request); }
      catch (error) { return json(response, 400, { error: error instanceof SyntaxError ? '反馈格式有误。' : error.message }); }
      const temp = `${output}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(review, null, 2) + '\n', { mode: 0o600 });
      await rename(temp, output);
      return json(response, 200, { saved: review });
    }
    const file = request.method === 'GET' && files.get(path);
    if (!file) return json(response, 404, { error: '找不到这个页面。' });
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)], 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch (error) {
    console.error(error);
    json(response, 500, { error: '无法读取或保存评审，请重试。' });
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`评审页面 ${origin}\n结果文件 ${output}`);
});
