import { createCipheriv, createDecipheriv, createECDH, createHmac, randomBytes } from 'node:crypto';
import { deflateRawSync, deflateSync, gunzipSync, inflateRawSync, inflateSync } from 'node:zlib';
import req from '../../util/req.js';

const KEY = 'gulu4k';
const NAME = '咕噜咕噜';
const API_URL = 'http://103.45.132.22:19987/app/bn/v2';
const HOST = 'http://103.45.132.22:19987';
const USER_AGENT = 'Dart/3.10 (dart:io)';
const APP_VERSION = '2.2.5';
const BUILD_NUMBER = '20109';
const APP_SIGNATURE = '32E0AB4FF93A29CE0E6F0BFB01F2F1B788E76262731F3F30F509CB822428ED58';
const DEVICE_BUILD = 'pangu-build-component-system-513739-s9vkd-rlxnj-p3rhm';
const VERSION_GUARD_MARKERS = ['__v99_', 'glgl.tv', '111.170.58.215', 'shu.jpg'];
const SEARCH_GUARD_MARKERS = [...VERSION_GUARD_MARKERS, '版本已失效', '最新版下载地址'];
const FALLBACK_PARSERS = { 28: { name: '咕噜金牌', url: 'http://111.170.58.215:5499/api.php?id=', mode: 'json', result_key: 'url', server: false } };
const CATEGORIES = [['1', '电影'], ['2', '电视剧'], ['3', '综艺'], ['4', '动漫'], ['5', '短剧'], ['60', '直播']];
const PLAY_ORDER = [
  '菲乐4K', '新咕噜4K', '鲸宝4K', 'VIP4K', '至臻4K', '至臻4k', '咕噜4K', '爱壹帆4K', '玫瑰4K', '咖啡4K', '臻影4K',
  '精品2K', '菲乐2K', '蓝光2K', '蓝光2k', '鲸宝2K', '短剧2K', '神话', '天堂', '☆讯飞☆', '☆奇趣☆', '☆果汁☆', '☆酷萌☆', '☆哔哩☆',
  '咖啡', '量子', '非凡', '暴风', '蚂蚁', '小熊', '极速', '海外', '花旗',
];

function text(value, fallback = '') { return value == null ? fallback : String(value); }
function trim(value) { return text(value).trim(); }
function bodyOf(request) { return request?.body || {}; }
function pageOf(value) { const page = Number.parseInt(value, 10); return Number.isFinite(page) && page > 0 ? page : 1; }
function listOf(value) { return Array.isArray(value) ? value : []; }
function readBuffer(value) { return Buffer.isBuffer(value) ? value : Buffer.from(value || []); }
function fieldVarint(number, value) {
  let current = BigInt(value);
  const out = [];
  while (current >= 128n) { out.push(Number((current & 127n) | 128n)); current >>= 7n; }
  out.push(Number(current));
  return Buffer.concat([varint(number << 3), Buffer.from(out)]);
}
function varint(value) {
  let current = BigInt(value);
  const out = [];
  while (current >= 128n) { out.push(Number((current & 127n) | 128n)); current >>= 7n; }
  out.push(Number(current));
  return Buffer.from(out);
}
function fieldBytes(number, value) {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return Buffer.concat([varint((number << 3) | 2), varint(data.length), data]);
}
function readVarint(data, position) {
  let value = 0n;
  let shift = 0n;
  let pos = position;
  while (pos < data.length && shift < 70n) {
    const byte = data[pos++];
    value |= BigInt(byte & 127) << shift;
    if (!(byte & 128)) return [Number(value), pos];
    shift += 7n;
  }
  throw new Error('invalid protobuf varint');
}
function parseFields(value) {
  const data = readBuffer(value);
  const fields = [];
  let position = 0;
  while (position < data.length) {
    let key;
    [key, position] = readVarint(data, position);
    const number = key >> 3;
    const wire = key & 7;
    let field;
    if (wire === 0) [field, position] = readVarint(data, position);
    else if (wire === 1) { field = data.subarray(position, position + 8); position += 8; }
    else if (wire === 2) {
      let size;
      [size, position] = readVarint(data, position);
      field = data.subarray(position, position + size);
      position += size;
    } else if (wire === 5) { field = data.subarray(position, position + 4); position += 4; }
    else throw new Error(`unsupported protobuf wire type ${wire}`);
    fields.push({ number, wire, value: field });
  }
  return fields;
}
function fieldValues(data, number, wire) { return parseFields(data).filter((field) => field.number === number && (wire === undefined || field.wire === wire)).map((field) => field.value); }
function fieldValue(data, number, fallback = null, wire) { const values = fieldValues(data, number, wire); return values.length ? values[values.length - 1] : fallback; }
function fieldText(value, fallback = '') {
  if (!Buffer.isBuffer(value)) return value == null ? fallback : String(value);
  try { return value.toString('utf8'); } catch { return fallback; }
}
function packedVarints(value) {
  const result = [];
  let pos = 0;
  while (pos < value.length) { let parsed; [parsed, pos] = readVarint(value, pos); result.push(parsed); }
  return result;
}
function rawDeflate(value) { return deflateRawSync(value, { level: 9, strategy: 3 }); }
function gzipOrPlain(value) {
  const data = readBuffer(value);
  if (data[0] === 0x1f && data[1] === 0x8b) { try { return gunzipSync(data); } catch {} }
  return data;
}
function aesEncrypt(key, iv, data) {
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}
function aesDecrypt(key, iv, data) {
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
function gcmEncrypt(key, nonce, data) {
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return { ciphertext, tag: cipher.getAuthTag() };
}
function gcmDecrypt(key, nonce, data, tag) {
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
function deriveKey(sessionId, shared) {
  const prk = createHmac('sha256', Buffer.from(sessionId, 'ascii')).update(shared).digest();
  return createHmac('sha256', prk).update(Buffer.from('v2-session\x01', 'binary')).digest();
}
function isPlayableUrl(value) { return /^https?:\/\//i.test(value || '') && /(?:\.m3u8|\.mp4|\.mkv|\.flv|\.ts|\/m\.php|\?data=)/i.test(value); }

class GuluProtocol {
  constructor(timeout = 15000) {
    this.timeout = timeout;
    this.sessionId = '';
    this.sessionKey = null;
    this.deviceId = randomBytes(8).toString('hex');
    this.requestId = 0;
    this.players = new Map();
    this.parsers = new Map();
  }
  async post(body, headerName, headerValue, extraHeaders = {}) {
    const response = await req.post(API_URL, body, {
      headers: { 'User-Agent': USER_AGENT, [headerName]: headerValue, 'Content-Type': 'application/x-protobuf', 'Accept-Encoding': 'gzip', 'Content-Length': String(body.length), Host: '103.45.132.22:19987', ...extraHeaders },
      timeout: this.timeout,
      responseType: 'arraybuffer',
    });
    return gzipOrPlain(response?.data);
  }
  async handshake() {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    const publicKey = ecdh.getPublicKey(null, 'uncompressed');
    const capabilities = Buffer.concat([fieldVarint(1, 1), fieldVarint(2, 0), fieldVarint(3, 1)]);
    const request = Buffer.concat([fieldBytes(1, publicKey), fieldBytes(2, '1.0.0'), fieldBytes(3, capabilities)]);
    const handshakeKey = randomBytes(16).toString('hex');
    const iv = randomBytes(16);
    const encrypted = Buffer.concat([iv, aesEncrypt(Buffer.from(handshakeKey, 'ascii'), iv, deflateSync(request, { level: 4 }))]).toString('base64');
    const content = await this.post(Buffer.from(encrypted), 'x-handshake-key', handshakeKey);
    const raw = Buffer.from(content.toString(), 'base64');
    const plain = inflateSync(aesDecrypt(Buffer.from(handshakeKey, 'ascii'), raw.subarray(0, 16), raw.subarray(16)));
    const sessionId = fieldValue(plain, 1, null, 2);
    const serverPublic = fieldValue(plain, 2, null, 2);
    if (!sessionId || !serverPublic) throw new Error('invalid handshake response');
    this.sessionId = fieldText(sessionId);
    this.sessionKey = ecdh.computeSecret(readBuffer(serverPublic));
    this.sessionKey = deriveKey(this.sessionId, this.sessionKey);
    this.requestId = 0;
  }
  encrypt(data) {
    const nonce = randomBytes(12);
    const encrypted = gcmEncrypt(this.sessionKey, nonce, rawDeflate(data));
    return Buffer.concat([nonce, encrypted.ciphertext, encrypted.tag]);
  }
  decrypt(data) {
    if (data.length < 28) throw new Error('invalid GCM payload');
    const compressed = gcmDecrypt(this.sessionKey, data.subarray(0, 12), data.subarray(12, -16), data.subarray(-16));
    return inflateRawSync(compressed);
  }
  async request(method, payload = Buffer.alloc(0), scope = 3, extraHeaders = {}) {
    if (!this.sessionId) await this.handshake();
    this.requestId += 1;
    const id = this.requestId;
    const core = Buffer.concat([fieldVarint(1, id), fieldVarint(2, scope), fieldVarint(3, method), fieldBytes(4, this.deviceId), fieldBytes(5, ''), fieldBytes(6, payload), fieldVarint(7, Date.now())]);
    const content = await this.post(Buffer.concat([fieldVarint(1, id), fieldBytes(2, this.encrypt(core))]), 'x-session-id', this.sessionId, extraHeaders);
    const encrypted = fieldValue(content, 2, null, 2);
    if (!encrypted) throw new Error(fieldText(fieldValue(content, 3, Buffer.from(''), 2), 'server rejected request'));
    const plain = this.decrypt(encrypted);
    const status = fieldText(fieldValue(plain, 3, Buffer.from(''), 2));
    if (status && !['ok', 'success'].includes(status)) throw new Error(status);
    return plain;
  }
  async boot() {
    const now = Date.now() * 1000;
    const app = Buffer.concat([fieldBytes(1, '咕噜咕噜'), fieldBytes(2, APP_VERSION), fieldBytes(3, 'com.himrsc.viz'), fieldBytes(4, APP_SIGNATURE), fieldBytes(5, BUILD_NUMBER), fieldVarint(6, now), fieldVarint(7, now)]);
    const device = Buffer.concat([fieldBytes(1, this.deviceId), fieldVarint(2, 1), fieldBytes(3, '15'), fieldBytes(4, 'Redmi K50 Ultra'), fieldBytes(5, 'Redmi/diting/diting:15/AQ3A.240912.001/OS2.0.215.0.VOACNXM:user/release-keys'), fieldBytes(6, 'Redmi'), fieldBytes(7, 'qcom'), fieldVarint(8, 0), fieldBytes(9, 'unknown'), fieldBytes(10, DEVICE_BUILD), fieldVarint(11, 0), fieldVarint(12, 35)]);
    const payload = Buffer.concat([fieldBytes(1, 'v2'), fieldBytes(2, 'android'), fieldBytes(3, 'gulu'), fieldBytes(4, app), fieldBytes(5, device)]);
    const response = await this.request(0, payload, 1);
    const config = fieldValue(response, 4, Buffer.alloc(0), 2);
    for (const item of fieldValues(config, 4, 2)) {
      const code = fieldText(fieldValue(item, 3, Buffer.alloc(0), 2));
      if (!code) continue;
      const parserIds = fieldValues(item, 8, 2).flatMap(packedVarints);
      this.players.set(code, { id: fieldValue(item, 1, 0, 0), name: fieldText(fieldValue(item, 4, Buffer.alloc(0), 2)), parserIds });
    }
    for (const item of fieldValues(config, 7, 2)) {
      const id = fieldValue(item, 1, 0, 0);
      if (id) this.parsers.set(Number(id), { name: fieldText(fieldValue(item, 2, Buffer.alloc(0), 2)), url: fieldText(fieldValue(item, 3, Buffer.alloc(0), 2)), mode: fieldText(fieldValue(item, 4, Buffer.alloc(0), 2)), resultKey: fieldText(fieldValue(item, 10, Buffer.from('url'), 2)), server: Boolean(fieldValue(item, 20, 0, 0)) });
    }
  }
  async search(keyword, page = 1, limit = 21, categoryId = '') {
    let filters = Buffer.concat([fieldBytes(18, 'vod_hits_month'), fieldVarint(19, 1)]);
    if (categoryId) filters = Buffer.concat([filters, fieldBytes(3, categoryId), fieldBytes(4, categoryId)]);
    const payload = Buffer.concat([fieldBytes(1, keyword), fieldVarint(2, page), fieldVarint(3, limit), fieldBytes(5, filters)]);
    const response = await this.request(61, payload);
    const data = fieldValue(response, 4, Buffer.alloc(0), 2);
    let videos = fieldValues(data, 1, 2).map((message) => ({ vod_id: String(fieldValue(message, 1, 0, 0)), vod_name: fieldText(fieldValue(message, 3, Buffer.alloc(0), 2)), vod_pic: fieldText(fieldValue(message, 6, Buffer.alloc(0), 2)), vod_remarks: fieldText(fieldValue(message, 11, Buffer.alloc(0), 2)) }));
    videos = videos.filter((video) => !SEARCH_GUARD_MARKERS.some((marker) => `${video.vod_name} ${video.vod_pic} ${video.vod_remarks}`.toLowerCase().includes(marker.toLowerCase())));
    const pageInfo = fieldValue(data, 2, Buffer.alloc(0), 2);
    return { videos, page: fieldValue(pageInfo, 1, page, 0), pagecount: fieldValue(pageInfo, 3, 1, 0), limit: fieldValue(pageInfo, 2, limit, 0), total: fieldValue(pageInfo, 4, videos.length, 0) };
  }
  async detail(vodId) {
    const payload = Buffer.concat([fieldVarint(1, Number(vodId)), fieldBytes(3, APP_VERSION), fieldBytes(4, '1'), fieldVarint(5, 1)]);
    const response = await this.request(62, payload, 3, { 'x-player-page-protection': '1' });
    const data = fieldValue(response, 4, Buffer.alloc(0), 2);
    const name = fieldText(fieldValue(data, 5, Buffer.alloc(0), 2));
    const guardText = [...[5, 13, 21].map((field) => fieldText(fieldValue(data, field, Buffer.alloc(0), 2))), ...fieldValues(data, 75, 2).map((source) => fieldText(fieldValue(source, 1, Buffer.alloc(0), 2)))].join(' ').toLowerCase();
    if (!name || name.startsWith('最新版本下载地址') || !Number(fieldValue(data, 1, 0, 0)) || VERSION_GUARD_MARKERS.some((marker) => guardText.includes(marker))) return null;
    const sources = [];
    for (const source of fieldValues(data, 75, 2)) {
      const code = fieldText(fieldValue(source, 1, Buffer.alloc(0), 2));
      if (!code || code.startsWith('__v99_')) continue;
      const config = this.players.get(code) || {};
      const episodes = fieldValues(source, 2, 2).map((episode, index) => ({ index: fieldValue(episode, 1, index + 1, 0), id: fieldText(fieldValue(episode, 3, Buffer.alloc(0), 2)), name: fieldText(fieldValue(episode, 4, Buffer.alloc(0), 2), `第${index + 1}集`) })).filter((episode) => episode.id);
      if (episodes.length) sources.push({ code, name: config.name || code, parserId: config.parserIds?.[0] || 0, episodes });
    }
    return { id: String(fieldValue(data, 1, vodId, 0)), name, pic: fieldText(fieldValue(data, 13, Buffer.alloc(0), 2)), remarks: fieldText(fieldValue(data, 22, Buffer.alloc(0), 2)), content: fieldText(fieldValue(data, 21, Buffer.alloc(0), 2)), area: fieldText(fieldValue(data, 28, Buffer.alloc(0), 2)), year: fieldText(fieldValue(data, 30, Buffer.alloc(0), 2)), sources };
  }
  async play(parserId, playId) {
    const response = await this.request(69, Buffer.concat([fieldVarint(1, Number(parserId)), fieldBytes(2, playId)]));
    const data = fieldValue(response, 4, Buffer.alloc(0), 2);
    return fieldText(fieldValue(data, 2, Buffer.alloc(0), 2));
  }
  reset() { this.sessionId = ''; this.sessionKey = null; this.requestId = 0; }
}

function cleanName(name) { return trim(name).replace(/[【\[\(（].*?[】\]）)]/g, '').replace(/\s*(?:HD|VIP|备用|推荐|极速|高清|标清|蓝光|超清|试看|抢先|预告|新版|旧版)\s*$/i, '').replace(/\s+/g, ' '); }
function rankName(name) {
  const clean = cleanName(name).toLowerCase();
  for (let i = 0; i < PLAY_ORDER.length; i += 1) { const keyword = PLAY_ORDER[i].toLowerCase(); if (clean === keyword || clean.startsWith(keyword) || clean.includes(keyword)) return i; }
  const upper = cleanName(name).toUpperCase();
  if (upper.includes('4K') || upper.includes('2160')) return 10.5;
  if (upper.includes('2K')) return 16.5;
  if (String(name).includes('蓝光')) return 18.5;
  if (upper.includes('1080') || String(name).includes('超清')) return 18.6;
  if (String(name).includes('☆')) return 21.5;
  return 100;
}
function playHeader(url) { return { 'User-Agent': USER_AGENT, ...((url && ['picovr.com', 'ppvod', 'drive.quark.cn'].some((domain) => url.includes(domain))) ? {} : { Referer: `${HOST}/` }) }; }
function extractPlayable(value, preferred = 'url') {
  if (typeof value === 'string') return isPlayableUrl(value) ? value : '';
  if (Array.isArray(value)) { for (const item of value) { const found = extractPlayable(item, preferred); if (found) return found; } return ''; }
  if (value && typeof value === 'object') {
    for (const key of [preferred, 'url', 'play_url', 'playUrl', 'm3u8', 'data']) if (key in value) { const found = extractPlayable(value[key], preferred); if (found) return found; }
    for (const item of Object.values(value)) { const found = extractPlayable(item, preferred); if (found) return found; }
  }
  return '';
}

function makeHandlers(protocol) {
  let booting = null;
  async function ensureBoot() {
    if (booting) return booting;
    booting = (async () => { if (!protocol.sessionId) await protocol.handshake(); if (!protocol.players.size) await protocol.boot(); })().finally(() => { booting = null; });
    try { await booting; } catch { protocol.reset(); throw new Error('咕噜协议初始化失败'); }
  }
  async function searchData(keyword, page, categoryId = '') {
    try { await ensureBoot(); return await protocol.search(keyword, page, 21, categoryId); }
    catch { protocol.reset(); try { await ensureBoot(); return await protocol.search(keyword, page, 21, categoryId); } catch { return { videos: [], page, pagecount: 1, limit: 21, total: 0 }; } }
  }
  function cards(videos) { return listOf(videos).filter((video) => video.vod_id).map((video) => ({ vod_id: String(video.vod_id), vod_name: text(video.vod_name), vod_pic: text(video.vod_pic), vod_remarks: text(video.vod_remarks) })); }
  async function home() { const result = await searchData('', 1); return { class: CATEGORIES.map(([type_id, type_name]) => ({ type_id, type_name })), filters: {}, list: cards(result.videos).slice(0, 20) }; }
  async function homeVod() { return { list: (await home()).list || [] }; }
  async function category(request) { const page = pageOf(bodyOf(request).page); const result = await searchData('', page, trim(bodyOf(request).id ?? bodyOf(request).type_id)); return { page, pagecount: result.pagecount || 1, limit: result.limit || 21, total: result.total || 0, list: cards(result.videos) }; }
  async function detail(request) {
    const raw = Array.isArray(bodyOf(request).id) ? bodyOf(request).id[0] : bodyOf(request).id;
    const match = String(raw || '').match(/(?:^|[^0-9])(\d{1,12})(?:$|[^0-9])/);
    const vodId = String(raw || '').trim().match(/^\d+$/) ? String(raw).trim() : (match?.[1] || '');
    if (!vodId) return { list: [] };
    await ensureBoot();
    let item;
    try { item = await protocol.detail(vodId); } catch { protocol.reset(); await ensureBoot(); item = await protocol.detail(vodId); }
    if (!item) return { list: [] };
    const pairs = [];
    for (const source of item.sources) {
      const episodes = source.episodes.map((episode) => `${episode.name}$${episode.id}@${source.parserId}@${item.name}@${episode.index}`);
      if (episodes.length) pairs.push({ name: cleanName(source.name), urls: episodes.join('#') });
    }
    pairs.sort((a, b) => rankName(a.name) - rankName(b.name));
    return { list: [{ vod_id: item.id, vod_name: item.name, vod_pic: item.pic, vod_year: item.year, vod_area: item.area, vod_content: item.content, vod_remarks: item.remarks, vod_play_from: pairs.map((pair) => pair.name).join('$$$'), vod_play_url: pairs.map((pair) => pair.urls).join('$$$') }] };
  }
  async function externalPlay(parser, playId) {
    const apiUrl = trim(parser?.url);
    if (!apiUrl) return '';
    const target = apiUrl.includes('{url}') ? apiUrl.replaceAll('{url}', encodeURIComponent(playId)) : apiUrl + encodeURIComponent(playId);
    try {
      const response = await req.get(target, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000, responseType: 'json' });
      return extractPlayable(response?.data, parser.resultKey || 'url');
    } catch { return ''; }
  }
  async function play(request) {
    const id = trim(bodyOf(request).id);
    const parts = id.split('@');
    const rawId = parts[0];
    const parserId = Number(parts[1] || 0);
    let url = isPlayableUrl(rawId) ? rawId : '';
    if (!url && parserId) {
      await ensureBoot();
      const parser = protocol.parsers.get(parserId) || FALLBACK_PARSERS[parserId];
      if (parser && parser.server === false) url = await externalPlay(parser, rawId);
      if (!url) { try { url = await protocol.play(parserId, rawId); } catch { protocol.reset(); await ensureBoot(); try { url = await protocol.play(parserId, rawId); } catch {} } }
    }
    return { parse: 0, url: url || '', header: playHeader(url || rawId) };
  }
  async function search(request) { const body = bodyOf(request); const keyword = trim(body.wd ?? body.key); if (!keyword) return { page: pageOf(body.page), pagecount: 1, limit: 21, total: 0, list: [] }; const page = pageOf(body.page); const result = await searchData(keyword, page); return { page, pagecount: result.pagecount || 1, limit: result.limit || 21, total: result.total || 0, list: cards(result.videos) }; }
  return { init: async () => ({}), home, homeVod, category, detail, play, search };
}

export default function createSpider(name, config) {
  void name; void config;
  const protocol = new GuluProtocol();
  const handlers = makeHandlers(protocol);
  return {
    meta: { key: KEY, name: NAME, type: 3 },
    api: async (fastify) => {
      fastify.post('/init', handlers.init);
      fastify.post('/home', handlers.home);
      fastify.post('/homeVod', handlers.homeVod);
      fastify.post('/category', handlers.category);
      fastify.post('/detail', handlers.detail);
      fastify.post('/play', handlers.play);
      fastify.post('/search', handlers.search);
    },
    check: async () => { try { await protocol.handshake(); return true; } catch { return false; } },
  };
}
