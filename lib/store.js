// ที่เก็บกระทง: ใช้ Postgres เมื่อมี DATABASE_URL (บน Vercel) ไม่งั้นใช้ไฟล์ JSON (ตอนพัฒนาในเครื่อง)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedKrathongs, seedLanterns } from './krathong.js';

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const isServerless = Boolean(process.env.VERCEL);

// ---------- Postgres ----------
let sqlPromise;
async function sql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const { default: postgres } = await import('postgres');
      // prepare: false ให้ใช้กับ connection pooler ของ Neon/Supabase ได้
      const db = postgres(DB_URL, { ssl: process.env.PGSSLMODE === 'disable' ? false : 'require', max: 1, prepare: false, idle_timeout: 20, onnotice: () => { } });
      await db`
        CREATE TABLE IF NOT EXISTS krathongs (
          id uuid PRIMARY KEY,
          name text NOT NULL,
          wish text NOT NULL,
          base text NOT NULL,
          petal text NOT NULL,
          fold text NOT NULL DEFAULT 'phanom',
          items jsonb,
          flower text,
          candle boolean,
          incense boolean,
          ip_hash text,
          created_at timestamptz NOT NULL DEFAULT now()
        )`;
      await db`ALTER TABLE krathongs ADD COLUMN IF NOT EXISTS delete_hash text`;
      await db`ALTER TABLE krathongs ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'krathong'`;
      await db`ALTER TABLE krathongs ADD COLUMN IF NOT EXISTS color text`;
      await db`ALTER TABLE krathongs ALTER COLUMN base DROP NOT NULL`;
      await db`ALTER TABLE krathongs ALTER COLUMN petal DROP NOT NULL`;
      await db`ALTER TABLE krathongs ALTER COLUMN fold DROP NOT NULL`;
      await db`CREATE INDEX IF NOT EXISTS krathongs_kind_idx ON krathongs (kind, created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS krathongs_created_idx ON krathongs (created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS krathongs_ip_idx ON krathongs (ip_hash, created_at DESC)`;
      const [{ n }] = await db`SELECT count(*)::int AS n FROM krathongs`;
      if (n === 0) for (const k of seedKrathongs()) await insertRow(db, k, null);
      const [{ l }] = await db`SELECT count(*)::int AS l FROM krathongs WHERE kind = 'lantern'`;
      if (l === 0) for (const k of seedLanterns()) await insertRow(db, k, null);
      return db;
    })().catch(err => { sqlPromise = undefined; throw err; });
  }
  return sqlPromise;
}

function insertRow(db, k, ipHash, deleteHash = null) {
  return db`
    INSERT INTO krathongs (id, kind, name, wish, base, petal, fold, items, flower, candle, incense, color, ip_hash, delete_hash, created_at)
    VALUES (${k.id}, ${k.kind || 'krathong'}, ${k.name}, ${k.wish}, ${k.base ?? null}, ${k.petal ?? null}, ${k.fold ?? null},
            ${k.items ? db.json(k.items) : null}, ${k.flower ?? null}, ${k.candle ?? null}, ${k.incense ?? null},
            ${k.color ?? null}, ${ipHash}, ${deleteHash}, ${k.createdAt})`;
}

// แปลงแถวในตารางเป็นรูปแบบที่หน้าเว็บใช้ (ไม่ส่ง ip_hash ออกไป)
function toKrathong(r) {
  const createdAt = new Date(r.created_at).toISOString();
  if (r.kind === 'lantern') return { id: r.id, kind: 'lantern', name: r.name, wish: r.wish, color: r.color || 'orange', createdAt };
  const k = { id: r.id, kind: 'krathong', name: r.name, wish: r.wish, base: r.base, petal: r.petal, fold: r.fold, createdAt };
  if (r.items) k.items = r.items;
  else Object.assign(k, { flower: r.flower, candle: r.candle, incense: r.incense });
  return k;
}

const pgStore = {
  kind: 'postgres',
  async list(limit, kind = 'krathong') {
    const db = await sql();
    return (await db`SELECT * FROM krathongs WHERE kind = ${kind} ORDER BY created_at DESC LIMIT ${limit}`).map(toKrathong);
  },
  async all() {
    const db = await sql();
    return (await db`SELECT * FROM krathongs ORDER BY created_at DESC`).map(toKrathong);
  },
  async count() {
    const db = await sql();
    const [{ n }] = await db`SELECT count(*)::int AS n FROM krathongs`;
    return n;
  },
  async create(k, ipHash, deleteHash) {
    const db = await sql();
    await insertRow(db, k, ipHash, deleteHash);
    return k;
  },
  async getMany(ids) {
    const db = await sql();
    return (await db`SELECT * FROM krathongs WHERE id = ANY(${ids}::uuid[]) ORDER BY created_at DESC`).map(toKrathong);
  },
  async deleteHashOf(id) {
    const db = await sql();
    const [row] = await db`SELECT delete_hash FROM krathongs WHERE id = ${id}`;
    return row ? { exists: true, deleteHash: row.delete_hash } : { exists: false };
  },
  async remove(id) {
    const db = await sql();
    const r = await db`DELETE FROM krathongs WHERE id = ${id}`;
    return r.count > 0;
  },
  async recentByIp(ipHash, seconds) {
    const db = await sql();
    const [{ n }] = await db`
      SELECT count(*)::int AS n FROM krathongs
      WHERE ip_hash = ${ipHash} AND created_at > now() - make_interval(secs => ${seconds})`;
    return n;
  }
};

// ---------- ไฟล์ JSON (เฉพาะในเครื่อง) ----------
const DATA_DIR = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'krathongs.json');
const MAX_FILE = 500;
let memory, saving = Promise.resolve();

async function loadFile() {
  if (!memory) {
    try { memory = JSON.parse(await readFile(DATA_FILE, 'utf8')); }
    catch { memory = [...seedLanterns(), ...seedKrathongs()]; await saveFile(); }
  }
  return memory;
}
function saveFile() {
  saving = saving.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(memory, null, 2));
  });
  return saving;
}
// ไฟล์เก็บแฮชรหัสลบไว้ในช่อง _dh — ตัดออกก่อนส่งให้หน้าเว็บเสมอ
const pub = ({ _dh, ...k }) => k;
const fileStore = {
  kind: 'file',
  async list(limit, kind = 'krathong') { return (await loadFile()).filter(x => (x.kind || 'krathong') === kind).slice(0, limit).map(pub); },
  async all() { return (await loadFile()).map(pub); },
  async count() { return (await loadFile()).length; },
  async create(k, ipHash, deleteHash) {
    memory = [{ ...k, _dh: deleteHash }, ...(await loadFile())].slice(0, MAX_FILE);
    await saveFile();
    return k;
  },
  async getMany(ids) {
    const set = new Set(ids);
    return (await loadFile()).filter(x => set.has(x.id)).map(pub);
  },
  async deleteHashOf(id) {
    const k = (await loadFile()).find(x => x.id === id);
    return k ? { exists: true, deleteHash: k._dh || null } : { exists: false };
  },
  async remove(id) {
    const before = (await loadFile()).length;
    memory = memory.filter(x => x.id !== id);
    if (memory.length === before) return false;
    await saveFile();
    return true;
  },
  recentByIp: null // ใช้ตัวนับในหน่วยความจำแทน (ดู ratelimit.js)
};

export function getStore() {
  if (DB_URL) return pgStore;
  if (isServerless) {
    // บน Vercel เขียนไฟล์ถาวรไม่ได้ — ต้องเชื่อมฐานข้อมูลก่อน
    throw Object.assign(new Error('ยังไม่ได้เชื่อมฐานข้อมูล: ตั้งค่า DATABASE_URL ในโปรเจกต์ Vercel'), { status: 503 });
  }
  return fileStore;
}
