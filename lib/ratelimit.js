// จำกัดการลอยกระทง: 5 ใบ / นาที / IP
// ลำดับที่ใช้: Upstash Redis (ถ้าตั้งค่าไว้) → นับจากฐานข้อมูล Postgres → ตัวนับในหน่วยความจำ (เฉพาะในเครื่อง)
import { createHash } from 'node:crypto';
import { RATE } from './krathong.js';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

/** IP ของผู้ใช้ (Vercel ส่งมาใน x-forwarded-for) */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim()
    || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/** เก็บเฉพาะค่าแฮชของ IP ไม่เก็บ IP จริง */
export function hashIp(ip) {
  return createHash('sha256').update(`${process.env.IP_SALT || 'loi-pai-loei'}:${ip}`).digest('hex').slice(0, 32);
}

let upstash;
async function upstashLimiter() {
  if (!upstash) {
    const [{ Ratelimit }, { Redis }] = await Promise.all([import('@upstash/ratelimit'), import('@upstash/redis')]);
    upstash = new Ratelimit({
      redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }),
      limiter: Ratelimit.slidingWindow(RATE.max, `${RATE.windowSec} s`),
      prefix: 'loipailoei:float'
    });
  }
  return upstash;
}

const hits = new Map();

/** คืนค่า true ถ้ายังลอยได้ */
export async function allow(ipHash, store) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const { success } = await (await upstashLimiter()).limit(ipHash);
    return success;
  }
  if (store.recentByIp) return (await store.recentByIp(ipHash, RATE.windowSec)) < RATE.max;
  const now = Date.now();
  const list = (hits.get(ipHash) || []).filter(t => now - t < RATE.windowSec * 1000);
  if (list.length >= RATE.max) return false;
  list.push(now);
  hits.set(ipHash, list);
  return true;
}
