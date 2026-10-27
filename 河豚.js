import { constants, createCipheriv, createDecipheriv, createPublicKey, publicEncrypt, randomBytes, randomInt, randomUUID } from 'node:crypto';
import req from '../../util/req.js';

const KEY = 'hetun4k';
const DEFAULT_CONFIG = {
  appName: '河豚',
  publicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCr8SzZhjYy+rsya1K09t8d2K50pWFoBkgUqMpKOiW+3IEVKd4eTdvg9RSOjQ82kypL6R9BnsmrS1V8s4PVDwjQbUtYhTPPC9Hz16qY7rpD6m0d2vr09/UpWQ5uOy9PR0QTrsioveZ+DIe9jc3C+zBCu/kZSY/R8stwJoiitki3gwIDAQAB',
  mSafeCode: 'V04XQZNYRWN6T0JODZFIAG5CTZB3PT0=',
  dataIv: 'OC1A06E197EF10CF3F6058CA7A803B5E',
  pkg: 'com.djlxxl.xcydzkj',
  host: 'https://az1-1456692500.cos.ap-guangzhou.myqcloud.com/az1.txt',
  vName: '7.0.0.2',
  from: '蓝光4k,蓝光',
};
const USER_AGENT = 'okhttp/3.12.1';
const COMMON_KEY = 'ed5fdsgucxumegqa';
const LINE_NAME_MAP = { '1': '最新', '2': '最热', '3': '最赞' };

function text(value, fallback = '') { return value == null ? fallback : String(value); }
function trim(value) { return text(value).trim(); }
function pageOf(value) { const page = Number.parseInt(value, 10); return Number.isFinite(page) && page > 0 ? page : 1; }
function listOf(value) { return Array.isArray(value) ? value : []; }
function objectOf(value) {
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) return value;
  try { const parsed = JSON.parse(String(value || '')); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; }
}
function bodyOf(request) { return request?.body || {}; }
async function loadExtend(request) {
  const body = bodyOf(request);
  const raw = body.extend ?? body.ext ?? body.config ?? body;
  if (raw && typeof raw === 'object') return raw;
  const value = trim(raw);
  if (!value) return {};
  if (value.includes('$')) {
    const split = value.indexOf('$');
    const url = value.slice(0, split).trim();
    const key = value.slice(split + 1).trim();
    try {
      const response = await req.get(url, { headers: {}, timeout: 12000, responseType: 'text' });
      const source = String(response?.data || '');
      let config = objectOf(source);
      if (!Object.keys(config).length) {
        const cleaned = source.replace(/(?:export\s+default\s+|module\.exports\s*=)|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '');
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) config = objectOf(match[0]);
      }
      const selected = key ? config[key] : config;
      return selected && typeof selected === 'object' ? selected : (selected ? { host: String(selected) } : {});
    } catch { return {}; }
  }
  if (value.startsWith('{')) return objectOf(value);
  return { host: value };
}
function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'binary');
  return Buffer.from(value || []);
}
function varint(value) {
  let current = BigInt(value);
  if (current < 0n) throw new Error('negative protobuf varint');
  const out = [];
  while (current >= 0x80n) { out.push(Number((current & 0x7fn) | 0x80n)); current >>= 7n; }
  out.push(Number(current));
  return Buffer.from(out);
}
function fieldInt(field, value) { return Buffer.concat([varint(field << 3), varint(value)]); }
function fieldBytes(field, value) {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return Buffer.concat([varint((field << 3) | 2), varint(data.length), data]);
}
function readVarint(data, start) {
  let value = 0n;
  let shift = 0n;
  let pos = start;
  while (pos < data.length && shift < 70n) {
    const byte = data[pos++];
    value |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) return [Number(value), pos];
    shift += 7n;
  }
  throw new Error('bad protobuf varint');
}
function parseProto(raw) {
  const data = toBuffer(raw);
  const fields = new Map();
  let pos = 0;
  while (pos < data.length) {
    let key;
    [key, pos] = readVarint(data, pos);
    const field = key >> 3;
    const wire = key & 7;
    let value;
    if (wire === 0) [value, pos] = readVarint(data, pos);
    else if (wire === 1) { value = data.subarray(pos, pos + 8); pos += 8; }
    else if (wire === 2) {
      let size;
      [size, pos] = readVarint(data, pos);
      if (pos + size > data.length) throw new Error('truncated protobuf field');
      value = data.subarray(pos, pos + size);
      pos += size;
    } else if (wire === 5) { value = data.subarray(pos, pos + 4); pos += 4; }
    else throw new Error(`unsupported protobuf wire type: ${wire}`);
    if (!fields.has(field)) fields.set(field, []);
    fields.get(field).push(value);
  }
  return fields;
}
function first(fields, number, fallback = Buffer.alloc(0)) { return fields.get(number)?.[0] ?? fallback; }
function fieldText(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  return value == null ? '' : String(value);
}
function randomString(length) {
  const chars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < Math.max(0, length - 1); i += 1) out += chars[randomInt(chars.length)];
  return `${out}=`;
}
function base64(value) { return Buffer.from(value).toString('base64'); }
function aesEncryptEcb(value, key) {
  const keyBytes = Buffer.from(String(key), 'utf8');
  const algorithm = `aes-${keyBytes.length * 8}-ecb`;
  const cipher = createCipheriv(algorithm, keyBytes, null);
  return Buffer.concat([cipher.update(Buffer.from(String(value), 'utf8')), cipher.final()]).toString('base64');
}
function aesDecryptEcb(value, key) {
  const keyBytes = Buffer.from(String(key), 'utf8');
  const decipher = createDecipheriv(`aes-${keyBytes.length * 8}-ecb`, keyBytes, null);
  return Buffer.concat([decipher.update(Buffer.from(value, 'base64')), decipher.final()]).toString('utf8');
}
function aesEncryptCbcHex(value, key) {
  const keyBytes = Buffer.from(String(key), 'utf8');
  const cipher = createCipheriv(`aes-${keyBytes.length * 8}-cbc`, keyBytes, keyBytes);
  return Buffer.concat([cipher.update(Buffer.from(value, 'utf8')), cipher.final()]).toString('hex');
}
function rsaEncrypt(value, keyBase64) {
  const key = createPublicKey({ key: Buffer.from(keyBase64, 'base64'), format: 'der', type: 'spki' });
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(String(value), 'utf8')).toString('base64');
}
function parseCardRequest(request) {
  const body = bodyOf(request);
  const raw = body.filters ?? body.extend ?? body.ext ?? body.filter;
  if (typeof raw === 'string') return objectOf(raw);
  return raw && typeof raw === 'object' ? raw : {};
}

function createRuntime(initialConfig = {}) {
  const state = {
    config: { ...DEFAULT_CONFIG, ...(initialConfig && typeof initialConfig === 'object' ? initialConfig : {}) },
    host: '', publicKey: '', dataKey: '', dataIv: '', version: '', dynamicKey: '',
    lineOrder: [], lineBlock: [], initialized: false,
  };

  function configure(values = {}) {
    state.config = { ...state.config, ...values };
    state.host = trim(state.config.host).replace(/\/$/, '');
    state.publicKey = trim(state.config.publicKey);
    state.dataKey = trim(state.config.mSafeCode);
    state.dataIv = trim(state.config.dataIv);
    state.version = trim(state.config.vName, '3.0.2.1');
    state.dynamicKey = '';
    state.initialized = false;
    const from = trim(state.config.from);
    const parts = from.split('@');
    state.lineOrder = parts[0] ? parts[0].split(/,|@@/).map((v) => v.trim()).filter(Boolean) : [];
    state.lineBlock = parts[1] ? parts[1].split(/,|@@/).map((v) => v.trim()).filter(Boolean) : [];
  }

  async function loadRemoteConfig() {
    if (!state.host || !/\.(?:txt|json)$/i.test(state.host)) return;
    try {
      const response = await req.get(state.host, { timeout: 12000, responseType: 'text' });
      const raw = String(response?.data || '');
      let config = objectOf(raw);
      if (!Object.keys(config).length) {
        const match = raw.replace(/(?:export\s+default\s+|module\.exports\s*=)|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '').match(/\{[\s\S]*\}/);
        if (match) config = objectOf(match[0]);
      }
      if (config.domain) state.host = trim(config.domain).replace(/\/$/, '');
    } catch {}
  }

  function device() {
    const uid = randomUUID().replace(/-/g, '').toUpperCase();
    return {
      country: 'CN', vName: state.version, cpuId: 'MT6893Z%2FCZA', young: 0,
      facturer: 'Xiaomi', pkg: state.config.pkg || '', uuid: uid,
      resolution: '1080x2272', mac: '02%3A00%3A00%3A00%3A00%3A00', abid: '397',
      model: 'M2012K11AC', plat: 'android', udid: uid, dpi: '440', net: '1',
      lang: 'zh', brand: 'Xiaomi', density: '2.75', appName: state.config.appName || '橘汁',
      cpu: 'arm64-v8a', chid: '10000', carrier: '%E8%81%94%E9%80%9A',
      _vOsCode: 30, vOs: '11', v: 1, tenantId: '', vApp: state.version.replace(/\./g, ''),
      device: 0, androidID: uid.toLowerCase().slice(0, 16),
    };
  }

  function publicHeaders(protobuf = true) {
    const current = device();
    const timestamp = Date.now();
    const random = randomString(16);
    current.sig = rsaEncrypt(`${timestamp}${random}${current.vApp || '3019'}`, state.dynamicKey || state.publicKey);
    current.random_str = random;
    current.timestamp = timestamp;
    const signature = aesEncryptEcb(`${timestamp}${random}`, state.dataIv);
    current.sig2 = signature.slice(0, 8);
    current.sig3 = signature.slice(8);
    const paramsData = aesEncryptCbcHex(JSON.stringify(current), COMMON_KEY);
    return {
      'User-Agent': USER_AGENT,
      Accept: protobuf ? 'application/x-protobuf' : 'application/json',
      'Content-Type': protobuf ? 'application/x-protobuf' : 'application/json; charset=utf-8',
      publicParams: JSON.stringify({ paramsData }),
    };
  }

  function secureBody(params) {
    const timestamp = Date.now();
    const random8 = randomString(8);
    const fake20 = randomString(20);
    const query = Object.entries(params).filter(([, value]) => value != null && String(value) !== '').map(([key, value]) => `${key}=${value}`).join('&');
    const encrypted = Buffer.from(random8 + aesEncryptEcb(`${query}${timestamp}`, state.dataKey), 'utf8');
    return Buffer.concat([fieldBytes(1, encrypted.subarray(0, 20)), fieldBytes(2, encrypted.subarray(20)), fieldBytes(3, fake20), fieldInt(4, timestamp), fieldBytes(5, random8)]);
  }

  async function post(path, body) {
    if (!state.host) throw new Error('接口域名获取失败');
    const response = await req.post(`${state.host}${path}`, body, { headers: publicHeaders(true), timeout: 18000, responseType: 'arraybuffer' });
    return toBuffer(response?.data);
  }

  async function getJson(path) {
    if (!state.host) throw new Error('接口域名获取失败');
    const response = await req.get(`${state.host}${path}`, { headers: publicHeaders(false), timeout: 18000, responseType: 'json' });
    return objectOf(response?.data);
  }

  function apiData(raw) { return toBuffer(first(parseProto(raw), 3, Buffer.alloc(0))); }

  async function loadDynamicKey() {
    const timestamp = Date.now();
    const random = randomString(16);
    const sign = rsaEncrypt(`${timestamp}${random}`, state.publicKey);
    const body = Buffer.concat([
      fieldInt(1, timestamp), fieldBytes(2, sign), fieldBytes(3, randomString(16)),
      fieldBytes(4, random), fieldBytes(5, randomString(16)),
    ]);
    const data = apiData(await post('/api/v5/find/app/zone', body));
    const fields = parseProto(data);
    state.dynamicKey = [2, 3, 4, 5].map((field) => fieldText(first(fields, field))).join('');
  }

  function parseCover(raw) {
    const fields = parseProto(raw);
    return { path: fieldText(first(fields, 1)), thumb: fieldText(first(fields, 2)) };
  }

  function parseDrama(raw) {
    const fields = parseProto(raw);
    const coverRaw = first(fields, 2, Buffer.alloc(0));
    const cover = coverRaw.length ? parseCover(coverRaw) : {};
    return {
      vod_id: String(first(fields, 3, 0)), vod_name: fieldText(first(fields, 5)),
      vod_pic: cover.thumb || cover.path || '', vod_remarks: fieldText(first(fields, 13)),
      vod_year: String(first(fields, 14, '')), vod_area: fieldText(first(fields, 1)),
    };
  }

  function parseDramaPage(raw) {
    const fields = parseProto(apiData(raw));
    return (fields.get(1) || []).map(parseDrama);
  }

  function parseVideo(raw) {
    const fields = parseProto(raw);
    return { title: fieldText(first(fields, 2)), path: fieldText(first(fields, 4)), source: fieldText(first(fields, 9)), sourceCn: fieldText(first(fields, 10)) };
  }

  function lineMatches(name, keyword) {
    const lower = name.trim().toLowerCase();
    const key = keyword.trim();
    if (key.startsWith('/') && key.endsWith('/')) {
      try { return new RegExp(key.slice(1, -1), 'i').test(lower); } catch {}
    }
    return lower.includes(key.toLowerCase());
  }

  function sortAndFilterLines(lines) {
    let output = [...lines];
    if (state.lineBlock.length) output = output.filter((line) => !state.lineBlock.some((key) => lineMatches(line.name, key)));
    if (state.lineOrder.length) {
      const sorted = [];
      let remaining = output;
      for (const keyword of state.lineOrder) {
        const matched = [];
        const unmatched = [];
        for (const line of remaining) (lineMatches(line.name, keyword) ? matched : unmatched).push(line);
        sorted.push(...matched);
        remaining = unmatched;
      }
      output = [...sorted, ...remaining];
    }
    return output;
  }

  async function initialize() {
    await loadRemoteConfig();
    if (state.host) {
      try { await loadDynamicKey(); } catch {}
    }
    state.initialized = true;
  }

  return { state, configure, initialize, device, publicHeaders, secureBody, post, getJson, apiData, parseCover, parseDrama, parseDramaPage, parseVideo, sortAndFilterLines };
}

function makeHandlers(runtime) {
  const state = runtime.state;

  async function init(request) {
    const ext = await loadExtend(request);
    const next = { ...state.config, ...(configFromBody(request)), ...(ext || {}) };
    runtime.configure(next);
    await runtime.initialize();
    return {};
  }

  async function ensureInitialized(request) {
    if (!state.initialized) {
      runtime.configure({ ...state.config, ...configFromBody(request) });
      await runtime.initialize();
    }
  }

  function home() {
    return { class: [], filters: {}, list: [] };
  }

  async function loadClasses() {
    const result = await runtime.getJson('/api/v3/drama/getCategory?orderBy=type_id');
    return listOf(result.data).filter((item) => String(item.name || '') !== '公告').map((item) => ({ type_id: String(item.id || ''), type_name: String(item.name || '') })).filter((item) => item.type_id);
  }

  async function homeWithData() {
    try {
      await ensureInitialized();
      return { class: await loadClasses(), filters: {}, list: [] };
    } catch { return home(); }
  }

  async function homeVod() {
    await ensureInitialized();
    try {
      const result = await runtime.getJson('/api/ex/v3/security/tag/list');
      let data = result.data;
      if (data && typeof data === 'string' && !['[', '{'].includes(data.trim()[0])) {
        data = aesDecryptEcb(data, state.dataKey);
        data = aesDecryptEcb(data, state.dataIv);
      }
      const blocks = Array.isArray(data) ? data : JSON.parse(String(data || '[]'));
      const videos = [];
      for (const block of blocks) for (const section of listOf(block.sections)) for (const vod of listOf(section.vodList)) {
        videos.push({ vod_id: String(vod.id || ''), vod_name: text(vod.name), vod_pic: text(vod.coverImage?.path), vod_remarks: text(vod.remark) });
      }
      return { list: videos };
    } catch { return { list: [] }; }
  }

  async function category(request) {
    await ensureInitialized(request);
    const body = bodyOf(request);
    const page = pageOf(body.page);
    const filters = parseCardRequest(request);
    const params = { pagesize: '21', typeId1: String(body.id ?? body.type_id ?? ''), page: String(page), vodOrderBy: filters['排序'] || filters.sort || '最新', vodArea: filters['地区'] || filters.area || '', vodLang: filters['语言'] || filters.lang || '', vodClass: filters['类型'] || filters.class || '', vodYear: filters['年份'] || filters.year || '' };
    try {
      const raw = await runtime.post('/api/proto/v5/drama/category', runtime.secureBody(params));
      const fields = parseProto(runtime.apiData(raw));
      const dramas = [];
      for (const item of fields.get(1) || []) {
        if (!Buffer.isBuffer(item)) continue;
        const f = parseProto(item);
        let pic = '';
        const cover = first(f, 2, Buffer.alloc(0));
        if (cover.length) {
          const cf = parseProto(cover);
          outer: for (const values of cf.values()) for (const value of values) {
            const candidate = fieldText(value).replace(/^[^h]*/, '');
            if (candidate.startsWith('http')) { pic = candidate; break outer; }
          }
        }
        dramas.push({ vod_id: String(first(f, 3, 0)), vod_name: fieldText(first(f, 5)), vod_pic: pic, vod_remarks: fieldText(first(f, 13)) });
      }
      return { page, pagecount: 9999, limit: 21, total: 9999, list: dramas };
    } catch { return { page, pagecount: 1, limit: 21, total: 0, list: [] }; }
  }

  async function detail(request) {
    await ensureInitialized(request);
    const rawIds = bodyOf(request).id;
    const id = Array.isArray(rawIds) ? rawIds[0] : rawIds;
    if (id == null) return { list: [] };
    try {
      const raw = await runtime.post('/api/proto/v5/drama/getDetail', runtime.secureBody({ id: String(id) }));
      const fields = parseProto(runtime.apiData(raw));
      const coverRaw = first(fields, 2, Buffer.alloc(0));
      const cover = coverRaw.length ? runtime.parseCover(coverRaw) : {};
      const groups = new Map();
      for (const item of fields.get(29) || []) {
        const video = runtime.parseVideo(item);
        const quality = video.sourceCn || video.source || '未知';
        const lineName = video.source && quality !== video.source ? `${quality} (${video.source})` : quality;
        let playId = video.path;
        if (!/\.(?:mp4|m3u8|flv|mkv|avi|ts|mov|mpd|m4a|wmv)(?:\?.*)?$/i.test(playId)) {
          playId = Buffer.from(JSON.stringify({ vodPlayFrom: video.source, playUrl: video.path }), 'utf8').toString('base64');
        }
        if (!groups.has(lineName)) groups.set(lineName, []);
        groups.get(lineName).push(`${video.title || '播放'}$${playId}`);
      }
      const lines = runtime.sortAndFilterLines([...groups.entries()].map(([name, urls]) => ({ name, urls })));
      return { list: [{
        vod_id: String(id), vod_name: fieldText(first(fields, 9)), vod_pic: cover.path || cover.thumb || '',
        vod_actor: fieldText(first(fields, 25)), vod_director: fieldText(first(fields, 12)), vod_area: fieldText(first(fields, 1)),
        vod_year: String(first(fields, 18, '')), vod_remarks: fieldText(first(fields, 26)), vod_content: fieldText(first(fields, 6)),
        vod_play_from: lines.map((line) => line.name).join('$$$'), vod_play_url: lines.map((line) => line.urls.join('#')).join('$$$'),
      }] };
    } catch { return { list: [] }; }
  }

  async function search(request) {
    await ensureInitialized(request);
    const body = bodyOf(request);
    const page = pageOf(body.page);
    const keyword = trim(body.wd ?? body.key);
    if (!keyword) return { page, pagecount: 1, limit: 21, total: 0, list: [] };
    try {
      const raw = await runtime.post('/api/proto/v5/drama/search', runtime.secureBody({ searchKeys: keyword, page: String(page), pagesize: '21' }));
      const list = runtime.parseDramaPage(raw).slice(0, 1);
      return { page, pagecount: list.length ? page + 1 : page, limit: 21, total: list.length, list };
    } catch { return { page, pagecount: 1, limit: 21, total: 0, list: [] }; }
  }

  async function play(request) {
    await ensureInitialized(request);
    const id = trim(bodyOf(request).id);
    if (/\.(?:mp4|m3u8|flv|mkv|avi|ts|mov|mpd|m4a|wmv)(?:\?.*)?$/i.test(id)) return { parse: 0, url: id, header: {} };
    try {
      const params = objectOf(Buffer.from(id, 'base64').toString('utf8'));
      const raw = await runtime.post('/api/proto/v5/videoUsableUrl', runtime.secureBody(params));
      const fields = parseProto(runtime.apiData(raw));
      const headers = {};
      for (const entry of fields.get(6) || []) {
        const item = parseProto(entry);
        const key = fieldText(first(item, 1));
        if (key) headers[key] = fieldText(first(item, 2));
      }
      return { parse: 0, url: fieldText(first(fields, 1)), header: headers };
    } catch {
      return { parse: 1, url: id, header: {} };
    }
  }

  return { init, home: homeWithData, homeVod, category, detail, search, play };
}

function configFromBody(request) {
  const body = bodyOf(request);
  const value = body.config ?? body.extend ?? body.ext;
  if (typeof value === 'string') return objectOf(value);
  return value && typeof value === 'object' ? value : {};
}

export default function createSpider(name, config) {
  const runtime = createRuntime(config || {});
  runtime.configure(runtime.state.config);
  const handlers = makeHandlers(runtime);
  return {
    meta: { key: KEY, name: text(config?.appName || config?.name, '河豚'), type: 3 },
    api: async (fastify) => {
      fastify.post('/init', handlers.init);
      fastify.post('/home', handlers.home);
      fastify.post('/homeVod', handlers.homeVod);
      fastify.post('/category', handlers.category);
      fastify.post('/detail', handlers.detail);
      fastify.post('/play', handlers.play);
      fastify.post('/search', handlers.search);
    },
    check: async () => {
      try {
        await runtime.initialize();
        const data = await runtime.getJson('/api/v3/drama/getCategory?orderBy=type_id');
        return Array.isArray(data?.data);
      } catch { return false; }
    },
  };
}
