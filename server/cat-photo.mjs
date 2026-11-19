import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { choices, catPhotoRequest, catPhotoViewRequest, catPhotoFeatureRegions, catChestRequest, catChestChoices, catCrownContrastRequest, catBodyPhotoRequest, catFlankPatchRequest, catVisibleTailRequest } from '../src/cat-photo-request.ts';

const maxPhoto = 1024 * 1024;
const maxBody = 3 * maxPhoto + 256;
const darkCoats = new Set(['tortie', 'calico', 'calico-mask', 'orange', 'white', 'gray', 'black']);
const defaultEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

class RequestError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

function photoFits(jpeg) {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8 || jpeg.at(-2) !== 0xff || jpeg.at(-1) !== 0xd9) {
    return false;
  }
  for (let offset = 2; offset + 4 < jpeg.length;) {
    if (jpeg[offset++] !== 0xff) return false;
    while (jpeg[offset] === 0xff) offset++;
    const marker = jpeg[offset++];
    if (marker === 0xda || offset + 2 > jpeg.length) return false;
    const size = jpeg.readUInt16BE(offset);
    if (size < 2 || offset + size > jpeg.length) return false;
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (size < 8) return false;
      const height = jpeg.readUInt16BE(offset + 3);
      const width = jpeg.readUInt16BE(offset + 5);
      return width > 0 && height > 0 && width <= 640 && height <= 640;
    }
    offset += size;
  }
  return false;
}

async function readPhoto(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json' || request.headers.origin) {
    throw new RequestError(415, 'invalid_content_type');
  }
  if (Number(request.headers['content-length']) > maxBody) throw new RequestError(413, 'photo_too_large');
  const chunks = [];
  let received = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    received += chunk.length;
    if (received > maxBody) throw new RequestError(413, 'photo_too_large');
    chunks.push(chunk);
  }
  let input;
  try { input = JSON.parse(Buffer.concat(chunks)); }
  catch { throw new RequestError(400, 'invalid_json'); }
  const photos = input?.photos ?? [input?.photo];
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 3) {
    throw new RequestError(400, 'invalid_photo_count');
  }
  for (const photo of photos) {
    if (typeof photo !== 'string' || photo.length > maxPhoto || photo.length % 4 !== 0
      || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo) || !photoFits(Buffer.from(photo, 'base64'))) {
      throw new RequestError(400, 'invalid_photo');
    }
  }
  const torsoPhoto = Number.isInteger(input.torsoPhoto) && input.torsoPhoto >= 1 && input.torsoPhoto <= photos.length
    ? input.torsoPhoto : 0;
  return { photos, torsoPhoto, checkDarkCoat: input.checkDarkCoat === true, checkCrownContrast: input.checkCrownContrast === true };
}

function normalizeObservations(value) {
  if (value?.cat === false) return { cat: false };
  if (value?.cat !== true || !choices.set.includes(value.set)) throw new RequestError(502, 'invalid_model_result');
  return {
    cat: true,
    ...Object.fromEntries(Object.entries(choices).map(([key, allowed]) => [
      key, allowed.includes(value[key]) ? value[key] : 'unknown',
    ])),
  };
}

function upstreamURL(base) {
  const url = new URL(base);
  const allowed = url.hostname === 'dashscope.aliyuncs.com'
    || /^[a-z0-9-]+\.cn-beijing\.maas\.aliyuncs\.com$/.test(url.hostname);
  if (!allowed || url.protocol !== 'https:' || url.port || url.username || url.password
    || url.pathname.replace(/\/$/, '') !== '/compatible-mode/v1' || url.search || url.hash) {
    throw new Error('Use a supported Beijing DashScope base URL');
  }
  return new URL('chat/completions', url.href.replace(/\/?$/, '/'));
}

export function createCatPhotoServer({ apiKey, base = defaultEndpoint, provider = 'dashscope', model = provider === 'ollama' ? 'qwen3-vl:2b-instruct' : 'qwen3-vl-plus', fetchAPI = fetch, maxPerMinute = 12 }) {
  if (provider !== 'ollama' && provider !== 'dashscope') throw new Error('Unsupported photo provider');
  const local = provider === 'ollama';
  if (!local && !apiKey) throw new Error('DASHSCOPE_API_KEY is required on the backend');
  const endpoint = local ? 'http://127.0.0.1:11434/api/chat' : upstreamURL(base);
  let windowStarted = Date.now();
  let admitted = 0;
  let active = 0;

  async function recognize(photos, contract, maxTokens) {
    const prompt = `${contract.prompt}\nJSON schema: ${JSON.stringify(contract.schema)}`;
    const payload = local ? {
      model, stream: false, think: false, format: contract.schema,
      options: { temperature: 0, seed: 42, num_ctx: 6144, num_predict: maxTokens },
      messages: [{ role: 'user', content: prompt, images: photos }],
    } : {
      model, temperature: 0, enable_thinking: false, max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return one JSON object only. Use only the allowed fields and enum values.' },
        { role: 'user', content: [
          ...photos.map(photo => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${photo}` } })),
          { type: 'text', text: prompt },
        ] },
      ],
    };
    const reply = await fetchAPI(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(local ? 60_000 : 35_000),
      headers: { 'Content-Type': 'application/json', ...(!local && { Authorization: `Bearer ${apiKey}` }) },
      body: JSON.stringify(payload),
    });
    if (!reply.ok) {
      if (reply.status === 401 || reply.status === 403) throw new RequestError(502, 'provider_auth');
      if (reply.status === 429) throw new RequestError(503, 'provider_busy');
      throw new RequestError(502, 'provider_error');
    }
    const body = await reply.json();
    const usage = body.usage;
    const cached = usage?.prompt_tokens_details?.cached_tokens;
    const measured = Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens >= 0
      && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens >= 0
      ? {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        cachedInputTokens: Number.isSafeInteger(cached) && cached >= 0 && cached <= usage.prompt_tokens ? cached : 0,
      } : null;
    let value;
    try { value = JSON.parse(local ? body.message?.content : body.choices?.[0]?.message?.content); }
    catch { throw new RequestError(502, 'invalid_model_result'); }
    return { value, usage: measured };
  }

  return createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, async (request, response) => {
    if (request.method === 'GET' && request.url === '/healthz') {
      return send(response, 200, { ready: true });
    }
    if (request.method !== 'POST' || request.url !== '/v1/cat-photo') {
      request.resume();
      return send(response, 404, { error: 'not_found' });
    }

    let counted = false;
    try {
      const input = await readPhoto(request);
      const now = Date.now();
      if (now - windowStarted >= 60_000) {
        windowStarted = now;
        admitted = 0;
      }
      if (active >= 2 || admitted >= maxPerMinute) throw new RequestError(429, 'busy');
      active++;
      admitted++;
      counted = true;

      const { photos } = input;
      const multiple = photos.length > 1;
      let individual;
      let main;
      if (multiple) {
        // Each view votes only for features visible in that view. Serialize local
        // calls to avoid loading several vision contexts at the same time.
        individual = [];
        for (const photo of photos) {
          individual.push(await recognize([photo], catPhotoRequest, 450));
        }
        main = await recognize(photos, catPhotoViewRequest(photos.length), 650);
      } else {
        main = await recognize(photos, catPhotoRequest, 450);
      }
      const observations = normalizeObservations(main.value);
      if (multiple && observations.cat) {
        observations.featurePhotos = Object.fromEntries(Object.keys(catPhotoFeatureRegions).map(key => {
          const index = main.value.featurePhotos?.[key];
          return [key, Number.isInteger(index) && index >= 1 && index <= photos.length ? index : 0];
        }));
      }
      const calls = [{ stage: 'appearance', usage: main.usage },
        ...(individual?.map(({ usage }, index) => ({ stage: `photo${index + 1}`, usage })) ?? [])];
      let coatPattern;
      if (input.checkDarkCoat && observations.cat && darkCoats.has(observations.set)) {
        try {
          const refined = await recognize([photos[0]], catPhotoRequest.darkCoat, 96);
          calls.push({ stage: 'darkCoat', usage: refined.usage });
          if (catPhotoRequest.darkCoat.schema.properties.pattern.enum.includes(refined.value?.pattern)) {
            coatPattern = refined.value.pattern;
          }
        } catch {
          // The main result is still usable. An unsuccessful call has unknown billed usage.
          calls.push({ stage: 'darkCoat', usage: null });
        }
      }
      if (observations.cat) {
        try {
          const chest = await recognize(photos, catChestRequest(photos.length), 110);
          calls.push({ stage: 'chest', usage: chest.usage });
          const { photo } = chest.value ?? {};
          const selection = Object.fromEntries(Object.entries(catChestChoices).map(([key, allowed]) => [
            key, allowed.includes(chest.value?.[key]) ? chest.value[key] : 'unknown',
          ]));
          if (Number.isInteger(photo) && photo >= 1 && photo <= photos.length) {
            observations.chestMarking = { ...selection, photo };
          }
        } catch {
          calls.push({ stage: 'chest', usage: null });
        }
      }
      if (input.checkCrownContrast && ['calico', 'calico-mask', 'tortie'].includes(observations.set)) {
        const crown = {};
        for (const pigment of ['dark', 'orange']) {
          try {
            const result = await recognize([photos[0]], catCrownContrastRequest(pigment), 65);
            calls.push({ stage: `crown-${pigment}`, usage: result.usage });
            crown[pigment] = result.value?.side;
          } catch {
            calls.push({ stage: `crown-${pigment}`, usage: null });
          }
        }
        if ((crown.dark === 'left' && crown.orange === 'right') || (crown.dark === 'right' && crown.orange === 'left')) {
          observations.crownMarking = {
            photo: 1, left: crown.orange === 'left' ? 'orange' : 'black',
            right: crown.orange === 'right' ? 'orange' : 'black',
          };
        }
      }
      if (observations.cat && ['calico', 'calico-mask', 'tortie', 'blaze-white', 'black-cap', 'white', 'orange'].includes(observations.set)) {
        async function inspectPart(stage, selected, contract, tokens) {
          try {
            const result = await recognize(selected, contract, tokens);
            calls.push({ stage, usage: result.usage });
            return Object.fromEntries(Object.entries(contract.schema.properties)
              .filter(([key, rule]) => rule.enum.includes(result.value?.[key]))
              .map(([key]) => [key, result.value[key]]));
          } catch {
            calls.push({ stage, usage: null });
            return {};
          }
        }
        const body = await inspectPart('body-markings', photos, catBodyPhotoRequest(photos.length), 135);
        if (body.white === 'head-tail' && body.photo) {
          const tail = await inspectPart('visible-tail', [photos[body.photo - 1]], catVisibleTailRequest, 55);
          body.visibleTail = tail.tail;
        }
        observations.bodyMarking = body;
        if (input.torsoPhoto && ['calico', 'calico-mask', 'tortie', 'blaze-white', 'black-cap'].includes(observations.set)) {
          const patch = await inspectPart('flank-patch', [photos[input.torsoPhoto - 1]], catFlankPatchRequest, 85);
          observations.flankMarking = { ...patch, photo: input.torsoPhoto };
        }
      }
      send(response, 200, { model, observations, individual: individual?.map(({ value }) => normalizeObservations(value)), coatPattern, calls });
    } catch (error) {
      const known = error instanceof RequestError;
      response.setHeader('Connection', 'close');
      send(response, known ? error.status : 502, { error: known ? error.code : 'provider_error' });
    } finally {
      if (counted) active--;
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PET_PHOTO_PORT || 8778);
  createCatPhotoServer({
    apiKey: process.env.DASHSCOPE_API_KEY,
    base: process.env.DASHSCOPE_BASE_URL || defaultEndpoint,
    provider: process.env.PET_PHOTO_PROVIDER || 'dashscope',
    model: process.env.PET_PHOTO_PROVIDER === 'ollama' ? undefined : process.env.DASHSCOPE_VISION_MODEL,
  }).listen(port, '127.0.0.1', () => console.log(`Cat photo backend listening on 127.0.0.1:${port}`));
}
