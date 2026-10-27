/**
 * 河豚 - 普通 JS / QuickJS 版
 * 可直接用 GitHub raw 作为 type=3 的 api，无需 Node
 */
const KEY = 'hetun4k';
const DEFAULT_CONFIG = {
  appName: '河豚',
  publicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCr8SzZhjYy+rsya1K09t8d2K50pWFoBkgUqMpKOiW+3IEVKd4eTdvg9RSOjQ82kypL6R9BnsmrS1V8s4PVDwjQbUtYhTPPC9Hz16qY7rpD6m0d2vr09/UpWQ5uOy9PR0QTrsioveZ+DIe9jc3C+zBCu/kZSY/R8stwJoiitki3gwIDAQAB',
  rsaN: 'q_Es2YY2Mvq7MmtStPbfHdiudKVhaAZIFKjKSjolvtyBFSneHk3b4PUUjo0PNpMqS-kfQZ7Jq0tVfLOD1Q8I0G1LWIUzzwvR89eqmO66Q-ptHdr69Pf1KVkObjsvT0dEE67IqL3mfgyHvY3NwvswQrv5GUmP0fLLcCaIorZIt4M',
  rsaE: 'AQAB',
  mSafeCode: 'V04XQZNYRWN6T0JODZFIAG5CTZB3PT0=',
  dataIv: 'OC1A06E197EF10CF3F6058CA7A803B5E',
  pkg: 'com.djlxxl.xcydzkj',
  host: 'https://az1-1456692500.cos.ap-guangzhou.myqcloud.com/az1.txt',
  vName: '7.0.0.2',
  from: '蓝光4k,蓝光',
};
const USER_AGENT = 'okhttp/3.12.1';
const COMMON_KEY = 'ed5fdsgucxumegqa';

function text(v, fb) { return v == null ? (fb || '') : String(v); }
function trim(v) { return text(v).trim(); }
function pageOf(v) { const p = Number.parseInt(v, 10); return Number.isFinite(p) && p > 0 ? p : 1; }
function listOf(v) { return Array.isArray(v) ? v : []; }
function objectOf(v) {
  if (v && typeof v === 'object') return v;
  try { const p = JSON.parse(String(v || '')); return p && typeof p === 'object' ? p : {}; } catch (e) { return {}; }
}
function u8(v) {
  if (v instanceof Uint8Array) return v;
  if (typeof v === 'string') {
    const out = new Uint8Array(v.length);
    for (let i = 0; i < v.length; i++) out[i] = v.charCodeAt(i) & 0xff;
    return out;
  }
  return new Uint8Array(v || []);
}
function utf8Encode(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(str));
  const s = unescape(encodeURIComponent(String(str)));
  return u8(s);
}
function utf8Decode(buf) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(u8(buf));
  try { return decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(u8(buf))))); } catch (e) {
    let s = ''; const b = u8(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s;
  }
}
function b64Encode(buf) {
  const b = u8(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  if (typeof btoa !== 'undefined') return btoa(s);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '', i = 0;
  while (i < b.length) {
    const a = b[i++], c = i < b.length ? b[i++] : 0, d = i < b.length ? b[i++] : 0;
    const n = (a << 16) | (c << 8) | d;
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + (i - 2 > b.length ? '=' : chars[(n >> 6) & 63]) + (i > b.length ? '=' : chars[n & 63]);
  }
  return out;
}
function b64Decode(str) {
  const s = String(str).replace(/[\r\n]/g, '');
  if (typeof atob !== 'undefined') {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = s.replace(/=+$/, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = (chars.indexOf(clean[i]) << 18) | (chars.indexOf(clean[i + 1]) << 12) | ((chars.indexOf(clean[i + 2]) & 63) << 6) | (chars.indexOf(clean[i + 3]) & 63);
    out.push((n >> 16) & 255);
    if (clean[i + 2] != null) out.push((n >> 8) & 255);
    if (clean[i + 3] != null) out.push(n & 255);
  }
  return new Uint8Array(out);
}
function b64urlToU8(s) {
  let t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return b64Decode(t);
}
function randomString(len) {
  const chars = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < Math.max(0, len - 1); i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + '=';
}
function randomUUID() {
  let s = '';
  for (let i = 0; i < 32; i++) s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
  return s;
}
function bytesToHex(buf) {
  const b = u8(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}
function modPow(base, exp, mod) {
  let result = 1n, b = base % mod, e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}
function rsaEncrypt(message, nB64url, eB64url) {
  const nBytes = b64urlToU8(nB64url);
  const eBytes = b64urlToU8(eB64url);
  let n = 0n, e = 0n;
  for (let i = 0; i < nBytes.length; i++) n = (n << 8n) | BigInt(nBytes[i]);
  for (let i = 0; i < eBytes.length; i++) e = (e << 8n) | BigInt(eBytes[i]);
  const k = nBytes.length;
  const msg = utf8Encode(message);
  if (msg.length > k - 11) throw new Error('RSA message too long');
  const em = new Uint8Array(k);
  em[0] = 0x00; em[1] = 0x02;
  const psLen = k - msg.length - 3;
  for (let i = 0; i < psLen; i++) {
    let r = 0;
    while (r === 0) r = Math.floor(Math.random() * 255) + 1;
    em[2 + i] = r;
  }
  em[2 + psLen] = 0x00;
  em.set(msg, 3 + psLen);
  let m = 0n;
  for (let i = 0; i < em.length; i++) m = (m << 8n) | BigInt(em[i]);
  const c = modPow(m, e, n);
  const out = new Uint8Array(k);
  let hex = c.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const cb = [];
  for (let i = 0; i < hex.length; i += 2) cb.push(parseInt(hex.slice(i, i + 2), 16));
  out.set(cb, k - cb.length);
  return b64Encode(out);
}

const SBOX = new Uint8Array([99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22]);
const INV_SBOX = new Uint8Array(256);
for (let i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i;
const RCON = new Uint8Array([0,1,2,4,8,16,32,64,128,27,54]);
function xtime(a) { return ((a << 1) ^ (((a >> 7) & 1) * 0x1b)) & 0xff; }
function mul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p & 0xff;
}
function aesKeyExpansion(key) {
  const keyBytes = typeof key === 'string' ? utf8Encode(key) : u8(key);
  const Nk = keyBytes.length / 4, Nr = Nk + 6;
  const w = new Uint32Array(4 * (Nr + 1));
  for (let i = 0; i < Nk; i++) w[i] = (keyBytes[4 * i] << 24) | (keyBytes[4 * i + 1] << 16) | (keyBytes[4 * i + 2] << 8) | keyBytes[4 * i + 3];
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let temp = w[i - 1];
    if (i % Nk === 0) temp = ((SBOX[(temp >>> 16) & 0xff] << 24) | (SBOX[(temp >>> 8) & 0xff] << 16) | (SBOX[temp & 0xff] << 8) | SBOX[(temp >>> 24) & 0xff]) ^ (RCON[i / Nk] << 24);
    else if (Nk > 6 && i % Nk === 4) temp = (SBOX[(temp >>> 24) & 0xff] << 24) | (SBOX[(temp >>> 16) & 0xff] << 16) | (SBOX[(temp >>> 8) & 0xff] << 8) | SBOX[temp & 0xff];
    w[i] = w[i - Nk] ^ temp;
  }
  return { w: w, Nr: Nr };
}
function mixCol(c) {
  const a0 = (c >>> 24) & 0xff, a1 = (c >>> 16) & 0xff, a2 = (c >>> 8) & 0xff, a3 = c & 0xff;
  const r0 = xtime(a0) ^ (xtime(a1) ^ a1) ^ a2 ^ a3;
  const r1 = a0 ^ xtime(a1) ^ (xtime(a2) ^ a2) ^ a3;
  const r2 = a0 ^ a1 ^ xtime(a2) ^ (xtime(a3) ^ a3);
  const r3 = (xtime(a0) ^ a0) ^ a1 ^ a2 ^ xtime(a3);
  return ((r0 & 0xff) << 24) | ((r1 & 0xff) << 16) | ((r2 & 0xff) << 8) | (r3 & 0xff);
}
function invMixCol(c) {
  const a0 = (c >>> 24) & 0xff, a1 = (c >>> 16) & 0xff, a2 = (c >>> 8) & 0xff, a3 = c & 0xff;
  return ((mul(a0, 0x0e) ^ mul(a1, 0x0b) ^ mul(a2, 0x0d) ^ mul(a3, 0x09)) << 24) | ((mul(a0, 0x09) ^ mul(a1, 0x0e) ^ mul(a2, 0x0b) ^ mul(a3, 0x0d)) << 16) | ((mul(a0, 0x0d) ^ mul(a1, 0x09) ^ mul(a2, 0x0e) ^ mul(a3, 0x0b)) << 8) | (mul(a0, 0x0b) ^ mul(a1, 0x0d) ^ mul(a2, 0x09) ^ mul(a3, 0x0e));
}
function aesEncryptBlock(input, exp) {
  const w = exp.w, Nr = exp.Nr;
  let s0 = ((input[0] << 24) | (input[1] << 16) | (input[2] << 8) | input[3]) ^ w[0];
  let s1 = ((input[4] << 24) | (input[5] << 16) | (input[6] << 8) | input[7]) ^ w[1];
  let s2 = ((input[8] << 24) | (input[9] << 16) | (input[10] << 8) | input[11]) ^ w[2];
  let s3 = ((input[12] << 24) | (input[13] << 16) | (input[14] << 8) | input[15]) ^ w[3];
  for (let round = 1; round < Nr; round++) {
    const t0 = (SBOX[(s0 >>> 24) & 0xff] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff];
    const t1 = (SBOX[(s1 >>> 24) & 0xff] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff];
    const t2 = (SBOX[(s2 >>> 24) & 0xff] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff];
    const t3 = (SBOX[(s3 >>> 24) & 0xff] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff];
    s0 = mixCol(t0) ^ w[4 * round]; s1 = mixCol(t1) ^ w[4 * round + 1]; s2 = mixCol(t2) ^ w[4 * round + 2]; s3 = mixCol(t3) ^ w[4 * round + 3];
  }
  const t0 = (SBOX[(s0 >>> 24) & 0xff] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff];
  const t1 = (SBOX[(s1 >>> 24) & 0xff] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff];
  const t2 = (SBOX[(s2 >>> 24) & 0xff] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff];
  const t3 = (SBOX[(s3 >>> 24) & 0xff] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff];
  const f0 = t0 ^ w[4 * Nr], f1 = t1 ^ w[4 * Nr + 1], f2 = t2 ^ w[4 * Nr + 2], f3 = t3 ^ w[4 * Nr + 3];
  return new Uint8Array([(f0 >>> 24) & 0xff, (f0 >>> 16) & 0xff, (f0 >>> 8) & 0xff, f0 & 0xff, (f1 >>> 24) & 0xff, (f1 >>> 16) & 0xff, (f1 >>> 8) & 0xff, f1 & 0xff, (f2 >>> 24) & 0xff, (f2 >>> 16) & 0xff, (f2 >>> 8) & 0xff, f2 & 0xff, (f3 >>> 24) & 0xff, (f3 >>> 16) & 0xff, (f3 >>> 8) & 0xff, f3 & 0xff]);
}
function aesDecryptBlock(input, exp) {
  const w = exp.w, Nr = exp.Nr;
  let s0 = ((input[0] << 24) | (input[1] << 16) | (input[2] << 8) | input[3]) ^ w[4 * Nr];
  let s1 = ((input[4] << 24) | (input[5] << 16) | (input[6] << 8) | input[7]) ^ w[4 * Nr + 1];
  let s2 = ((input[8] << 24) | (input[9] << 16) | (input[10] << 8) | input[11]) ^ w[4 * Nr + 2];
  let s3 = ((input[12] << 24) | (input[13] << 16) | (input[14] << 8) | input[15]) ^ w[4 * Nr + 3];
  for (let round = Nr - 1; round >= 1; round--) {
    const t0 = (INV_SBOX[(s0 >>> 24) & 0xff] << 24) | (INV_SBOX[(s3 >>> 16) & 0xff] << 16) | (INV_SBOX[(s2 >>> 8) & 0xff] << 8) | INV_SBOX[s1 & 0xff];
    const t1 = (INV_SBOX[(s1 >>> 24) & 0xff] << 24) | (INV_SBOX[(s0 >>> 16) & 0xff] << 16) | (INV_SBOX[(s3 >>> 8) & 0xff] << 8) | INV_SBOX[s2 & 0xff];
    const t2 = (INV_SBOX[(s2 >>> 24) & 0xff] << 24) | (INV_SBOX[(s1 >>> 16) & 0xff] << 16) | (INV_SBOX[(s0 >>> 8) & 0xff] << 8) | INV_SBOX[s3 & 0xff];
    const t3 = (INV_SBOX[(s3 >>> 24) & 0xff] << 24) | (INV_SBOX[(s2 >>> 16) & 0xff] << 16) | (INV_SBOX[(s1 >>> 8) & 0xff] << 8) | INV_SBOX[s0 & 0xff];
    s0 = invMixCol(t0 ^ w[4 * round]); s1 = invMixCol(t1 ^ w[4 * round + 1]); s2 = invMixCol(t2 ^ w[4 * round + 2]); s3 = invMixCol(t3 ^ w[4 * round + 3]);
  }
  const t0 = (INV_SBOX[(s0 >>> 24) & 0xff] << 24) | (INV_SBOX[(s3 >>> 16) & 0xff] << 16) | (INV_SBOX[(s2 >>> 8) & 0xff] << 8) | INV_SBOX[s1 & 0xff];
  const t1 = (INV_SBOX[(s1 >>> 24) & 0xff] << 24) | (INV_SBOX[(s0 >>> 16) & 0xff] << 16) | (INV_SBOX[(s3 >>> 8) & 0xff] << 8) | INV_SBOX[s2 & 0xff];
  const t2 = (INV_SBOX[(s2 >>> 24) & 0xff] << 24) | (INV_SBOX[(s1 >>> 16) & 0xff] << 16) | (INV_SBOX[(s0 >>> 8) & 0xff] << 8) | INV_SBOX[s3 & 0xff];
  const t3 = (INV_SBOX[(s3 >>> 24) & 0xff] << 24) | (INV_SBOX[(s2 >>> 16) & 0xff] << 16) | (INV_SBOX[(s1 >>> 8) & 0xff] << 8) | INV_SBOX[s0 & 0xff];
  const f0 = t0 ^ w[0], f1 = t1 ^ w[1], f2 = t2 ^ w[2], f3 = t3 ^ w[3];
  return new Uint8Array([(f0 >>> 24) & 0xff, (f0 >>> 16) & 0xff, (f0 >>> 8) & 0xff, f0 & 0xff, (f1 >>> 24) & 0xff, (f1 >>> 16) & 0xff, (f1 >>> 8) & 0xff, f1 & 0xff, (f2 >>> 24) & 0xff, (f2 >>> 16) & 0xff, (f2 >>> 8) & 0xff, f2 & 0xff, (f3 >>> 24) & 0xff, (f3 >>> 16) & 0xff, (f3 >>> 8) & 0xff, f3 & 0xff]);
}
function pkcs7Pad(data) {
  const b = u8(data);
  const pad = 16 - (b.length % 16);
  const out = new Uint8Array(b.length + pad);
  out.set(b);
  for (let i = b.length; i < out.length; i++) out[i] = pad;
  return out;
}
function pkcs7Unpad(data) {
  const b = u8(data);
  if (!b.length) return b;
  const pad = b[b.length - 1];
  if (pad < 1 || pad > 16) return b;
  return b.subarray(0, b.length - pad);
}
function aesEncryptEcb(value, key) {
  const exp = aesKeyExpansion(key);
  const padded = pkcs7Pad(utf8Encode(String(value)));
  const out = new Uint8Array(padded.length);
  for (let i = 0; i < padded.length; i += 16) out.set(aesEncryptBlock(padded.subarray(i, i + 16), exp), i);
  return b64Encode(out);
}
function aesDecryptEcb(value, key) {
  const exp = aesKeyExpansion(key);
  const data = b64Decode(value);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 16) out.set(aesDecryptBlock(data.subarray(i, i + 16), exp), i);
  return utf8Decode(pkcs7Unpad(out));
}
function aesEncryptCbcHex(value, key) {
  const keyBytes = typeof key === 'string' ? utf8Encode(key) : u8(key);
  const exp = aesKeyExpansion(keyBytes);
  const iv = keyBytes.length >= 16 ? keyBytes.subarray(0, 16) : keyBytes;
  const padded = pkcs7Pad(utf8Encode(String(value)));
  const out = new Uint8Array(padded.length);
  let prev = new Uint8Array(iv);
  for (let i = 0; i < padded.length; i += 16) {
    const block = new Uint8Array(16);
    for (let j = 0; j < 16; j++) block[j] = padded[i + j] ^ prev[j];
    const enc = aesEncryptBlock(block, exp);
    out.set(enc, i);
    prev = enc;
  }
  return bytesToHex(out);
}

function varint(value) {
  let current = BigInt(value);
  const out = [];
  while (current >= 0x80n) { out.push(Number((current & 0x7fn) | 0x80n)); current >>= 7n; }
  out.push(Number(current));
  return new Uint8Array(out);
}
function concatBytes() {
  const parts = arguments;
  let len = 0;
  for (let i = 0; i < parts.length; i++) len += u8(parts[i]).length;
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i < parts.length; i++) { const b = u8(parts[i]); out.set(b, o); o += b.length; }
  return out;
}
function fieldInt(field, value) { return concatBytes(varint(field << 3), varint(value)); }
function fieldBytes(field, value) {
  const data = typeof value === 'string' ? utf8Encode(value) : u8(value);
  return concatBytes(varint((field << 3) | 2), varint(data.length), data);
}
function readVarint(data, start) {
  let value = 0n, shift = 0n, pos = start;
  const d = u8(data);
  while (pos < d.length && shift < 70n) {
    const byte = d[pos++];
    value |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) return [Number(value), pos];
    shift += 7n;
  }
  throw new Error('bad varint');
}
function parseProto(raw) {
  const data = u8(raw);
  const fields = new Map();
  let pos = 0;
  while (pos < data.length) {
    let key; const r = readVarint(data, pos); key = r[0]; pos = r[1];
    const field = key >> 3, wire = key & 7;
    let value;
    if (wire === 0) { const r2 = readVarint(data, pos); value = r2[0]; pos = r2[1]; }
    else if (wire === 1) { value = data.subarray(pos, pos + 8); pos += 8; }
    else if (wire === 2) { const r2 = readVarint(data, pos); const size = r2[0]; pos = r2[1]; value = data.subarray(pos, pos + size); pos += size; }
    else if (wire === 5) { value = data.subarray(pos, pos + 4); pos += 4; }
    else throw new Error('bad wire');
    if (!fields.has(field)) fields.set(field, []);
    fields.get(field).push(value);
  }
  return fields;
}
function first(fields, number, fallback) {
  const arr = fields.get(number);
  return (arr && arr[0] != null) ? arr[0] : (fallback != null ? fallback : new Uint8Array(0));
}
function fieldText(value) {
  if (value instanceof Uint8Array) return utf8Decode(value);
  return value == null ? '' : String(value);
}

async function httpRequest(url, opts) {
  opts = opts || {};
  const method = (opts.method || 'GET').toUpperCase();
  const headers = opts.headers || {};
  const body = opts.body;
  const timeout = opts.timeout || 18000;
  if (typeof net !== 'undefined' && net.http) {
    const res = await net.http(url, { method: method, headers: headers, body: body, timeout: timeout, buffer: opts.buffer ? 2 : 0 });
    if (opts.buffer) {
      if (res.content instanceof Uint8Array) return res.content;
      if (typeof res.content === 'string') return u8(res.content);
      return u8(res.content || []);
    }
    if (typeof res.content === 'string') {
      try { return JSON.parse(res.content); } catch (e) { return res.content; }
    }
    return res.content;
  }
  if (typeof fetch === 'function') {
    const res = await fetch(url, { method: method, headers: headers, body: body });
    if (opts.buffer) return new Uint8Array(await res.arrayBuffer());
    const ct = (res.headers.get('content-type') || '');
    if (ct.indexOf('json') >= 0) return await res.json();
    return await res.text();
  }
  throw new Error('no http client');
}

const state = {
  config: Object.assign({}, DEFAULT_CONFIG),
  host: '', publicKey: '', dataKey: '', dataIv: '', version: '', dynamicKey: '',
  lineOrder: [], lineBlock: [], initialized: false,
  rsaN: DEFAULT_CONFIG.rsaN, rsaE: DEFAULT_CONFIG.rsaE,
};

function configure(values) {
  state.config = Object.assign({}, state.config, values || {});
  state.host = trim(state.config.host).replace(/\/$/, '');
  state.publicKey = trim(state.config.publicKey);
  state.dataKey = trim(state.config.mSafeCode);
  state.dataIv = trim(state.config.dataIv);
  state.version = trim(state.config.vName) || '3.0.2.1';
  state.dynamicKey = '';
  state.initialized = false;
  state.rsaN = state.config.rsaN || DEFAULT_CONFIG.rsaN;
  state.rsaE = state.config.rsaE || DEFAULT_CONFIG.rsaE;
  const from = trim(state.config.from);
  const parts = from.split('@');
  state.lineOrder = parts[0] ? parts[0].split(/,|@@/).map(function (v) { return v.trim(); }).filter(Boolean) : [];
  state.lineBlock = parts[1] ? parts[1].split(/,|@@/).map(function (v) { return v.trim(); }).filter(Boolean) : [];
}

async function loadRemoteConfig() {
  if (!state.host || !/\.(?:txt|json)$/i.test(state.host)) return;
  try {
    const raw = await httpRequest(state.host, { timeout: 12000 });
    let config = objectOf(raw);
    if (!Object.keys(config).length && typeof raw === 'string') {
      const match = raw.replace(/(?:export\s+default\s+|module\.exports\s*=)|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '').match(/\{[\s\S]*\}/);
      if (match) config = objectOf(match[0]);
    }
    if (config.domain) state.host = trim(config.domain).replace(/\/$/, '');
  } catch (e) {}
}

function device() {
  const uid = randomUUID();
  return {
    country: 'CN', vName: state.version, cpuId: 'MT6893Z%2FCZA', young: 0,
    facturer: 'Xiaomi', pkg: state.config.pkg || '', uuid: uid,
    resolution: '1080x2272', mac: '02%3A00%3A00%3A00%3A00%3A00', abid: '397',
    model: 'M2012K11AC', plat: 'android', udid: uid, dpi: '440', net: '1',
    lang: 'zh', brand: 'Xiaomi', density: '2.75', appName: state.config.appName || '河豚',
    cpu: 'arm64-v8a', chid: '10000', carrier: '%E8%81%94%E9%80%9A',
    _vOsCode: 30, vOs: '11', v: 1, tenantId: '', vApp: state.version.replace(/\./g, ''),
    device: 0, androidID: uid.toLowerCase().slice(0, 16),
  };
}

function publicHeaders(protobuf) {
  const current = device();
  const timestamp = Date.now();
  const random = randomString(16);
  current.sig = rsaEncrypt(String(timestamp) + random + (current.vApp || '3019'), state.rsaN, state.rsaE);
  current.random_str = random;
  current.timestamp = timestamp;
  const signature = aesEncryptEcb(String(timestamp) + random, state.dataIv);
  current.sig2 = signature.slice(0, 8);
  current.sig3 = signature.slice(8);
  const paramsData = aesEncryptCbcHex(JSON.stringify(current), COMMON_KEY);
  return {
    'User-Agent': USER_AGENT,
    Accept: protobuf ? 'application/x-protobuf' : 'application/json',
    'Content-Type': protobuf ? 'application/x-protobuf' : 'application/json; charset=utf-8',
    publicParams: JSON.stringify({ paramsData: paramsData }),
  };
}

function secureBody(params) {
  const timestamp = Date.now();
  const random8 = randomString(8);
  const fake20 = randomString(20);
  const query = Object.keys(params).filter(function (k) { return params[k] != null && String(params[k]) !== ''; }).map(function (k) { return k + '=' + params[k]; }).join('&');
  const encryptedStr = random8 + aesEncryptEcb(query + timestamp, state.dataKey);
  const encrypted = utf8Encode(encryptedStr);
  return concatBytes(
    fieldBytes(1, encrypted.subarray(0, 20)),
    fieldBytes(2, encrypted.subarray(20)),
    fieldBytes(3, utf8Encode(fake20)),
    fieldInt(4, timestamp),
    fieldBytes(5, utf8Encode(random8))
  );
}

async function post(path, body) {
  if (!state.host) throw new Error('接口域名获取失败');
  return await httpRequest(state.host + path, { method: 'POST', headers: publicHeaders(true), body: body, timeout: 18000, buffer: true });
}
async function getJson(path) {
  if (!state.host) throw new Error('接口域名获取失败');
  return objectOf(await httpRequest(state.host + path, { method: 'GET', headers: publicHeaders(false), timeout: 18000 }));
}
function apiData(raw) { return u8(first(parseProto(raw), 3, new Uint8Array(0))); }

async function loadDynamicKey() {
  try {
    const timestamp = Date.now();
    const random = randomString(16);
    const sign = rsaEncrypt(String(timestamp) + random, state.rsaN, state.rsaE);
    const body = concatBytes(
      fieldInt(1, timestamp), fieldBytes(2, utf8Encode(sign)), fieldBytes(3, utf8Encode(randomString(16))),
      fieldBytes(4, utf8Encode(random)), fieldBytes(5, utf8Encode(randomString(16)))
    );
    const data = apiData(await post('/api/v5/find/app/zone', body));
    const fields = parseProto(data);
    state.dynamicKey = [2, 3, 4, 5].map(function (f) { return fieldText(first(fields, f)); }).join('');
  } catch (e) {}
}

function parseCover(raw) {
  const fields = parseProto(raw);
  return { path: fieldText(first(fields, 1)), thumb: fieldText(first(fields, 2)) };
}
function parseDrama(raw) {
  const fields = parseProto(raw);
  const coverRaw = first(fields, 2, new Uint8Array(0));
  const cover = coverRaw.length ? parseCover(coverRaw) : {};
  return {
    vod_id: String(first(fields, 3, 0)),
    vod_name: fieldText(first(fields, 5)),
    vod_pic: cover.thumb || cover.path || '',
    vod_remarks: fieldText(first(fields, 13)),
    vod_year: String(first(fields, 14, '')),
    vod_area: fieldText(first(fields, 1)),
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
    try { return new RegExp(key.slice(1, -1), 'i').test(lower); } catch (e) {}
  }
  return lower.indexOf(key.toLowerCase()) >= 0;
}
function sortAndFilterLines(lines) {
  let output = lines.slice();
  if (state.lineBlock.length) output = output.filter(function (line) { return !state.lineBlock.some(function (key) { return lineMatches(line.name, key); }); });
  if (state.lineOrder.length) {
    const sorted = [];
    let remaining = output;
    for (let i = 0; i < state.lineOrder.length; i++) {
      const keyword = state.lineOrder[i];
      const matched = [], unmatched = [];
      for (let j = 0; j < remaining.length; j++) (lineMatches(remaining[j].name, keyword) ? matched : unmatched).push(remaining[j]);
      sorted.push.apply(sorted, matched);
      remaining = unmatched;
    }
    output = sorted.concat(remaining);
  }
  return output;
}

async function initialize() {
  await loadRemoteConfig();
  if (state.host) { try { await loadDynamicKey(); } catch (e) {} }
  state.initialized = true;
}
async function ensureInitialized() {
  if (!state.initialized) {
    configure(state.config);
    await initialize();
  }
}

async function init(ext) {
  let cfg = {};
  if (typeof ext === 'string') {
    if (ext.charAt(0) === '{') cfg = objectOf(ext);
    else if (ext.indexOf('http') >= 0) cfg = { host: ext };
    else cfg = objectOf(ext);
  } else if (ext && typeof ext === 'object') cfg = ext;
  configure(Object.assign({}, DEFAULT_CONFIG, cfg));
  await initialize();
  return {};
}

async function home() {
  try {
    await ensureInitialized();
    const result = await getJson('/api/v3/drama/getCategory?orderBy=type_id');
    const classes = listOf(result.data).filter(function (item) { return String(item.name || '') !== '公告'; }).map(function (item) {
      return { type_id: String(item.id || ''), type_name: String(item.name || '') };
    }).filter(function (item) { return item.type_id; });
    return { class: classes, filters: {}, list: [] };
  } catch (e) { return { class: [], filters: {}, list: [] }; }
}

async function homeVod() {
  try {
    await ensureInitialized();
    const result = await getJson('/api/ex/v3/security/tag/list');
    let data = result.data;
    if (data && typeof data === 'string' && data.trim() && '[{'.indexOf(data.trim().charAt(0)) < 0) {
      try { data = aesDecryptEcb(data, state.dataKey); data = aesDecryptEcb(data, state.dataIv); } catch (e) {
        try { data = JSON.parse(data); } catch (e2) { data = []; }
      }
    }
    const blocks = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data || '[]') : []);
    const videos = [];
    for (let i = 0; i < blocks.length; i++) {
      const sections = listOf(blocks[i].sections);
      for (let j = 0; j < sections.length; j++) {
        const vods = listOf(sections[j].vodList);
        for (let k = 0; k < vods.length; k++) {
          const vod = vods[k];
          videos.push({ vod_id: String(vod.id || ''), vod_name: text(vod.name), vod_pic: text(vod.coverImage && vod.coverImage.path), vod_remarks: text(vod.remark) });
        }
      }
    }
    return { list: videos };
  } catch (e) { return { list: [] }; }
}

async function category(tid, pg, filter, extend) {
  try {
    await ensureInitialized();
    const page = pageOf(pg);
    const filters = objectOf(extend || filter || {});
    const params = {
      pagesize: '21', typeId1: String(tid || ''), page: String(page),
      vodOrderBy: filters['排序'] || filters.sort || '最新',
      vodArea: filters['地区'] || filters.area || '',
      vodLang: filters['语言'] || filters.lang || '',
      vodClass: filters['类型'] || filters.class || '',
      vodYear: filters['年份'] || filters.year || '',
    };
    const raw = await post('/api/proto/v5/drama/category', secureBody(params));
    const fields = parseProto(apiData(raw));
    const dramas = [];
    const items = fields.get(1) || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!(item instanceof Uint8Array)) continue;
      const f = parseProto(item);
      let pic = '';
      const cover = first(f, 2, new Uint8Array(0));
      if (cover.length) {
        const cf = parseProto(cover);
        const vals = Array.from(cf.values());
        outer: for (let vi = 0; vi < vals.length; vi++) {
          for (let vj = 0; vj < vals[vi].length; vj++) {
            const candidate = fieldText(vals[vi][vj]).replace(/^[^h]*/, '');
            if (candidate.indexOf('http') === 0) { pic = candidate; break outer; }
          }
        }
      }
      dramas.push({ vod_id: String(first(f, 3, 0)), vod_name: fieldText(first(f, 5)), vod_pic: pic, vod_remarks: fieldText(first(f, 13)) });
    }
    return { page: page, pagecount: 9999, limit: 21, total: 9999, list: dramas };
  } catch (e) { return { page: pageOf(pg), pagecount: 1, limit: 21, total: 0, list: [] }; }
}

async function detail(id) {
  try {
    await ensureInitialized();
    const vid = Array.isArray(id) ? id[0] : id;
    if (vid == null) return { list: [] };
    const raw = await post('/api/proto/v5/drama/getDetail', secureBody({ id: String(vid) }));
    const fields = parseProto(apiData(raw));
    const coverRaw = first(fields, 2, new Uint8Array(0));
    const cover = coverRaw.length ? parseCover(coverRaw) : {};
    const groups = new Map();
    const vids = fields.get(29) || [];
    for (let i = 0; i < vids.length; i++) {
      const video = parseVideo(vids[i]);
      const quality = video.sourceCn || video.source || '未知';
      const lineName = video.source && quality !== video.source ? (quality + ' (' + video.source + ')') : quality;
      let playId = video.path;
      if (!/\.(?:mp4|m3u8|flv|mkv|avi|ts|mov|mpd|m4a|wmv)(?:\?.*)?$/i.test(playId)) {
        playId = b64Encode(utf8Encode(JSON.stringify({ vodPlayFrom: video.source, playUrl: video.path })));
      }
      if (!groups.has(lineName)) groups.set(lineName, []);
      groups.get(lineName).push((video.title || '播放') + '$' + playId);
    }
    const lines = sortAndFilterLines(Array.from(groups.entries()).map(function (e) { return { name: e[0], urls: e[1] }; }));
    return {
      list: [{
        vod_id: String(vid),
        vod_name: fieldText(first(fields, 9)),
        vod_pic: cover.path || cover.thumb || '',
        vod_actor: fieldText(first(fields, 25)),
        vod_director: fieldText(first(fields, 12)),
        vod_area: fieldText(first(fields, 1)),
        vod_year: String(first(fields, 18, '')),
        vod_remarks: fieldText(first(fields, 26)),
        vod_content: fieldText(first(fields, 6)),
        vod_play_from: lines.map(function (l) { return l.name; }).join('$$$'),
        vod_play_url: lines.map(function (l) { return l.urls.join('#'); }).join('$$$'),
      }],
    };
  } catch (e) { return { list: [] }; }
}

async function search(wd, quick, pg) {
  const page = pageOf(pg);
  const keyword = trim(wd);
  if (!keyword) return { page: page, pagecount: 1, limit: 21, total: 0, list: [] };
  try {
    await ensureInitialized();
    const raw = await post('/api/proto/v5/drama/search', secureBody({ searchKeys: keyword, page: String(page), pagesize: '21' }));
    const list = parseDramaPage(raw);
    return { page: page, pagecount: list.length >= 21 ? page + 1 : page, limit: 21, total: list.length, list: list };
  } catch (e) { return { page: page, pagecount: 1, limit: 21, total: 0, list: [] }; }
}

async function play(flag, id, flags) {
  const playId = trim(id);
  if (/\.(?:mp4|m3u8|flv|mkv|avi|ts|mov|mpd|m4a|wmv)(?:\?.*)?$/i.test(playId)) return { parse: 0, url: playId, header: {} };
  try {
    await ensureInitialized();
    const params = objectOf(utf8Decode(b64Decode(playId)));
    const raw = await post('/api/proto/v5/videoUsableUrl', secureBody(params));
    const fields = parseProto(apiData(raw));
    const headers = {};
    const entries = fields.get(6) || [];
    for (let i = 0; i < entries.length; i++) {
      const item = parseProto(entries[i]);
      const key = fieldText(first(item, 1));
      if (key) headers[key] = fieldText(first(item, 2));
    }
    return { parse: 0, url: fieldText(first(fields, 1)), header: headers };
  } catch (e) { return { parse: 1, url: playId, header: {} }; }
}

export default { init: init, home: home, homeVod: homeVod, category: category, detail: detail, search: search, play: play };
