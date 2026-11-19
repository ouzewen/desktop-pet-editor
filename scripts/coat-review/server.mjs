import { createServer } from 'node:http';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const app = dirname(fileURLToPath(import.meta.url));
const root = resolve(app, '../..');
const roundFile = resolve(process.argv[2] ?? resolve(app, 'round-02.json'));
const round = JSON.parse(await readFile(roundFile, 'utf8'));
const output = resolve(process.argv[3] ?? resolve(root, 'output', `coat-review-${round.id}-feedback.json`));
const port = Number(process.env.COAT_REVIEW_PORT ?? 4179);
const origin = `http://127.0.0.1:${port}`;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};
const files = new Map([
  ['/', resolve(app, 'index.html')],
  ['/review.css', resolve(app, 'review.css')],
  ['/review.js', resolve(app, 'review.js')],
]);
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
    options: group.options.map(option => ({ ...option, image: imageUrl(`${group.id}-${option.id}`, option.image) })),
  })),
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
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 48_000) throw new Error('反馈内容过长。');
    chunks.push(chunk);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (data?.round !== round.id || !data.groups || typeof data.groups !== 'object') throw new Error('评审轮次不匹配。');
  const groups = round.groups.map(group => {
    const entry = data.groups[group.id];
    const option = group.options.find(item => item.id === entry?.choice);
    const feedback = typeof entry?.feedback === 'string' ? entry.feedback.trim() : '';
    if (!option && entry?.choice !== 'reject') throw new Error(`请完成「${group.label}」。`);
    if (!option && !feedback) throw new Error(`请为「${group.label}」填写修改意见。`);
    if (feedback.length > 1000) throw new Error('每组意见最多 1000 字。');
    return { id: group.id, label: group.label, choice: entry.choice, selectedLabel: option?.label ?? null, feedback };
  });
  const note = typeof data.note === 'string' ? data.note.trim() : '';
  if (note.length > 1500) throw new Error('整体意见最多 1500 字。');
  return { round: round.id, submittedAt: new Date().toISOString(), groups, note };
}

createServer(async (request, response) => {
  try {
    const path = new URL(request.url, origin).pathname;
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
