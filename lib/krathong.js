// กติกาข้อมูลกระทง — ใช้ร่วมกันทั้ง Vercel Functions และเซิร์ฟเวอร์ Express ตอนพัฒนาในเครื่อง
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

/** รหัสลบกระทง: ส่งให้ผู้ลอยครั้งเดียวตอนลอย เซิร์ฟเวอร์เก็บแค่ค่าแฮช */
export const newDeleteToken = () => randomBytes(24).toString('base64url');
export const hashToken = (t) => createHash('sha256').update(String(t)).digest('hex');

/** เทียบข้อความแบบใช้เวลาคงที่ กันการเดารหัสจากเวลาตอบกลับ */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s));

// ตัวเลือกที่อนุญาต (ต้องตรงกับ client/src/options.js และ client/src/parts.jsx)
export const ALLOWED = {
  base: ['banana', 'bread', 'coconut'],
  petal: ['leaf', 'lotus', 'gold', 'orchid'],
  fold: ['phanom', 'rose', 'nail', 'thorn'],
  flower: ['marigold', 'rose', 'jasmine', 'orchid']
};

export const LANTERN_COLORS = ['orange', 'red', 'gold', 'pink'];
export const PART_TYPES = ['marigold', 'rose', 'jasmine', 'orchid', 'lotus', 'globe', 'candle', 'incense', 'coin', 'leaf', 'crown', 'garland'];
export const MAX_ITEMS = 30;
export const RATE = { max: 5, windowSec: 60 };

const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n)) * 10) / 10 : null;
};

function cleanItems(raw) {
  if (!Array.isArray(raw) || raw.length > MAX_ITEMS) return null;
  const out = [];
  for (const it of raw) {
    if (!it || !PART_TYPES.includes(it.type)) return null;
    const x = num(it.x, 0, 200), y = num(it.y, 0, 170), s = num(it.s ?? 1, 0.5, 2), r = num(it.r ?? 0, -180, 180);
    if ([x, y, s, r].includes(null)) return null;
    out.push({ type: it.type, x, y, s, r });
  }
  return out;
}

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, max);

/** ตรวจและทำความสะอาดข้อมูลที่ส่งมา คืน { value } หรือ { error } */
export function validate(body = {}) {
  const name = clean(body.name, 30) || 'ไม่ประสงค์ออกนาม';
  const wish = clean(body.wish, 140);
  if (body.kind === 'lantern') {
   // โคมลอย: มีแค่ชื่อ คำอธิษฐาน และสีโคม
    if (!wish) return { error: 'กรุณาเขียนคำอธิษฐานก่อนปล่อยโคม' };
   const color = body.color ?? 'orange';
    if (!LANTERN_COLORS.includes(color)) return { error: 'สีโคมไม่ถูกต้อง' };
    return { value: { id: randomUUID(), kind: 'lantern', name, wish, color, createdAt: new Date().toISOString() } };
  }
  if (!wish) return { error: 'กรุณาเขียนคำอธิษฐานก่อนลอยกระทง' };
  for (const key of ['base', 'petal']) {
    if (!ALLOWED[key].includes(body[key])) return { error: `ตัวเลือก ${key} ไม่ถูกต้อง` };
  }
  const fold = body.fold ?? 'phanom';
  if (!ALLOWED.fold.includes(fold)) return { error: 'ตัวเลือก fold ไม่ถูกต้อง' };
  const value = { id: randomUUID(), kind: 'krathong', name, wish, base: body.base, petal: body.petal, fold, createdAt: new Date().toISOString() };
  if (body.items !== undefined) {
    const items = cleanItems(body.items);
    if (!items) return { error: 'ข้อมูลวัสดุบนกระทงไม่ถูกต้อง' };
    value.items = items;
  } else {
    // กระทงแบบเดิม (เลือกดอกไม้ชนิดเดียว)
    if (!ALLOWED.flower.includes(body.flower)) return { error: 'ตัวเลือก flower ไม่ถูกต้อง' };
    Object.assign(value, { flower: body.flower, candle: Boolean(body.candle), incense: Boolean(body.incense) });
  }
  return { value };
}

export function seedLanterns() {
  return [
    ['น้องฝน', 'ขอให้ปีหน้าดีกว่าปีนี้', 'orange'],
    ['ครอบครัวสุขใจ', 'ขอให้ทุกคนในบ้านปลอดภัย', 'gold'],
    ['เจ', 'ขอให้ได้งานใหม่ที่ชอบ', 'red'],
    ['ไม่ประสงค์ออกนาม', 'ปล่อยความเศร้าให้ลอยไปกับโคม', 'pink'],
    ['ป้าแดง', 'ขอให้หลาน ๆ เรียนเก่ง', 'orange']
  ].map(([name, wish, color], i) => ({
    id: randomUUID(), kind: 'lantern', name, wish, color,
    createdAt: new Date(Date.now() - (i + 1) * 420000).toISOString()
  }));
}

/** กระทงตัวอย่าง ใส่ให้อัตโนมัติเมื่อฐานข้อมูลยังว่าง */
export function seedKrathongs() {
  return [
    ['แม่', 'ขอให้ลูก ๆ ทุกคนสุขภาพแข็งแรง', 'banana', 'leaf', 'marigold'],
    ['ต้นข้าว', 'ขอให้สอบติดคณะที่ฝันไว้', 'bread', 'lotus', 'jasmine'],
    ['พี่หมอก', 'ขอโทษแม่น้ำ และขอบคุณที่ให้ชีวิต', 'coconut', 'gold', 'rose'],
    ['มายด์', 'ขอให้ปีหน้าได้เที่ยวเชียงใหม่กับครอบครัว', 'banana', 'orchid', 'orchid'],
    ['ลุงชัย', 'ขอให้ร้านขายดี ลูกค้าเยอะ ๆ', 'banana', 'gold', 'marigold'],
    ['ไม่ประสงค์ออกนาม', 'ขอให้ใจเบาขึ้นกว่าปีที่แล้ว', 'bread', 'leaf', 'rose']
  ].map(([name, wish, base, petal, flower], i) => ({
    id: randomUUID(), kind: 'krathong', name, wish, base, petal, flower,
    fold: ALLOWED.fold[i % 4], candle: true, incense: i % 2 === 0,
    createdAt: new Date(Date.now() - (i + 1) * 600000).toISOString()
  }));
}
