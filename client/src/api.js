// เรียก API ของ Node.js ก่อน ถ้าไม่มีเซิร์ฟเวอร์ (เช่นเปิดเป็นไฟล์เดียว) จะใช้ข้อมูลในเบราว์เซอร์แทน
const LOCAL_KEY = 'loykrathong:local';
const MINE_KEY = 'loykrathong:mine';   // { [id]: deleteToken } ของกระทงที่ลอยจากเครื่องนี้
const ADMIN_KEY = 'loykrathong:admin'; // รหัสผู้ดูแล (เก็บแค่ในแท็บนี้)

function readJson(storage, key, fallback) {
  try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeJson(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
const readMine = () => readJson(localStorage, MINE_KEY, {});
export const isMine = (id) => Boolean(readMine()[id]);
export const mineCount = () => Object.keys(readMine()).length;
function remember(id, token) {
  const mine = readMine();
  mine[id] = token;
  writeJson(localStorage, MINE_KEY, mine);
}
function forget(id) {
  const mine = readMine();
  delete mine[id];
  writeJson(localStorage, MINE_KEY, mine);
}

export const getAdminKey = () => { try { return sessionStorage.getItem(ADMIN_KEY) || ''; } catch { return ''; } };
export function setAdminKey(key) {
  try { key ? sessionStorage.setItem(ADMIN_KEY, key) : sessionStorage.removeItem(ADMIN_KEY); } catch { /* ignore */ }
}

/** ตัวอย่างกระทง */
const SAMPLE = [
  ['แม่', 'ขอให้ลูก ๆ ทุกคนสุขภาพแข็งแรง', 'banana', 'leaf', 'marigold'],
  ['ต้นข้าว', 'ขอให้สอบติดคณะที่ฝันไว้', 'bread', 'lotus', 'jasmine'],
  ['พี่หมอก', 'ขอโทษแม่น้ำ และขอบคุณที่ให้ชีวิต', 'coconut', 'gold', 'rose'],
  ['มายด์', 'ขอให้ปีหน้าได้เที่ยวเชียงใหม่กับครอบครัว', 'banana', 'orchid', 'orchid'],
  ['ลุงชัย', 'ขอให้ร้านขายดี ลูกค้าเยอะ ๆ', 'banana', 'gold', 'marigold'],
  ['ไม่ประสงค์ออกนาม', 'ขอให้ใจเบาขึ้นกว่าปีที่แล้ว', 'bread', 'leaf', 'rose']
].map(([name, wish, base, petal, flower], i) => ({
  id: `sample-${i}`, name, wish, base, petal, flower, fold: ['phanom', 'rose', 'nail', 'thorn'][i % 4], candle: true, incense: i % 2 === 0,
  createdAt: new Date(Date.now() - (i + 1) * 600000).toISOString()
}));

/** ตัวอย่างโคมลอย */
const SAMPLE_LANTERNS = [
  ['น้องฝน', 'ขอให้ปีหน้าดีกว่าปีนี้', 'orange'],
  ['ครอบครัวสุขใจ', 'ขอให้ทุกคนในบ้านปลอดภัย', 'gold'],
  ['เจ', 'ขอให้ได้งานใหม่ที่ชอบ', 'red'],
  ['ไม่ประสงค์ออกนาม', 'ปล่อยความเศร้าให้ลอยไปกับโคม', 'pink'],
  ['ป้าแดง', 'ขอให้หลาน ๆ เรียนเก่ง', 'orange']
].map(([name, wish, color], i) => ({
  id: `sample-lantern-${i}`, kind: 'lantern', name, wish, color,
  createdAt: new Date(Date.now() - (i + 1) * 420000).toISOString()
}));

const isLantern = (k) => k.kind === 'lantern';

export let mode = 'server';

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function writeLocal(list) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 100))); } catch { /* ignore */ }
}

async function fetchJson(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw Object.assign(new Error('no-api'), { offline: true });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ลอยกระทงไม่สำเร็จ ลองอีกครั้ง');
  return data;
}

export async function listKrathongs() {
  if (mode === 'server') {
    try { return await fetchJson('/api/krathongs?limit=80'); }
    catch { mode = 'local'; }
  }
  return [...readLocal().filter(k => !isLantern(k)), ...SAMPLE];
}

/** โคมลอยล่าสุด */
export async function listLanterns() {
  if (mode === 'server') {
    try { return await fetchJson('/api/krathongs?kind=lantern&limit=40'); }
    catch { mode = 'local'; }
  }
  return [...readLocal().filter(isLantern), ...SAMPLE_LANTERNS];
}

export async function createKrathong(data) {
  if (mode === 'server') {
    try {
      const { deleteToken, ...k } = await fetchJson('/api/krathongs', { method: 'POST', body: JSON.stringify(data) });
      if (deleteToken) remember(k.id, deleteToken);
      return k;
    } catch (err) {
      if (!err.offline && !(err instanceof TypeError)) throw err;
      mode = 'local';
    }
  }
  const k = {
    ...data,
    name: data.name.trim().slice(0, 30) || 'ไม่ประสงค์ออกนาม',
    wish: data.wish.trim().slice(0, 140),
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString()
  };
  writeLocal([k, ...readLocal()]);
  remember(k.id, 'local');
  return k;
}

/** กระทงทั้งหมดที่ลอยจากเครื่องนี้ (รวมใบที่ลอยพ้นจอไปแล้ว) ใหม่สุดก่อน */
export async function listMine() {
  const ids = Object.keys(readMine());
  if (!ids.length) return [];
  if (mode === 'server') {
    try {
      const found = await fetchJson(`/api/krathongs?ids=${ids.slice(-50).map(encodeURIComponent).join(',')}`);
      // ใบที่เซิร์ฟเวอร์ไม่มีแล้ว (เช่นผู้ดูแลลบไป) เอาออกจากรายการของเครื่องนี้
      const have = new Set(found.map(k => k.id));
      ids.slice(-50).forEach(id => { if (!have.has(id)) forget(id); });
      return found;
    } catch (err) {
      if (!err.offline && !(err instanceof TypeError)) throw err;
      mode = 'local';
    }
  }
  const set = new Set(ids);
  return readLocal().filter(k => set.has(k.id));
}

/** ลบกระทง: ใช้รหัสลบของเจ้าของ หรือรหัสผู้ดูแล */
export async function deleteKrathong(id) {
  if (mode === 'local') {
    writeLocal(readLocal().filter(k => k.id !== id));
    forget(id);
    return;
  }
  const headers = { 'Content-Type': 'application/json' };
  const token = readMine()[id];
  if (token) headers['X-Delete-Token'] = token;
  const admin = getAdminKey();
  if (admin) headers.Authorization = `Bearer ${admin}`;
  try {
    await fetchJson(`/api/krathongs?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  } catch (err) {
    if (err.offline) throw new Error('ลบไม่สำเร็จ ลองอีกครั้ง');
    if (!/ลอยหายไปแล้ว/.test(err.message)) throw err; // ถูกลบไปก่อนแล้วก็ถือว่าสำเร็จ
  }
  forget(id);
}
