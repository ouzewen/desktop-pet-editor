import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, runnerImport } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const stage = join(root, 'output/cat-pixel80/assets');
const { module: { assetGroups } } = await runnerImport(join(root, 'src/pet-assets.ts'));
const files = new Map(assetGroups.filter(group => group.usage === 'current' && group.consumer === 'cat')
  .flatMap(group => group.files)
  .map(({ key }) => ['/assets/' + key + '.png', join(stage, key + '.png')]));

const missing = [...files.values()].filter(path => !existsSync(path));
if (missing.length) throw Error('请先暂存 80×80 素材 · 缺少 ' + missing.length + ' 个文件');

const server = await createServer({
  root,
  mode: 'cat-pixel80',
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
  plugins: [{
    name: 'cat-pixel80-preview',
    configureServer(vite) {
      vite.middlewares.use((request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') return next();
        const filename = files.get(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
        if (!filename) return next();
        response.setHeader('Content-Type', 'image/png');
        response.setHeader('Cache-Control', 'no-store');
        if (request.method === 'HEAD') return response.end();
        createReadStream(filename).on('error', error => response.destroy(error)).pipe(response);
      });
    },
  }],
});
await server.listen();
server.printUrls();
