// GET  /api/krathongs?limit=80  → รายการกระทงล่าสุด (เพิ่ม &kind=lantern เพื่อดึงโคมลอย)
// GET  /api/krathongs?ids=a,b,c → กระทงตาม id (ใช้กับ "กระทงของฉัน" สูงสุด 50 ใบ)
// POST /api/krathongs           → ลอยกระทงใหม่ (ตอบกลับพร้อม deleteToken ให้ผู้ลอยเก็บไว้)
// DELETE /api/krathongs?id=...  → ลบกระทง: ส่ง header X-Delete-Token (เจ้าของ) หรือ Authorization: Bearer <ADMIN_TOKEN> (ผู้ดูแล)
import { validate, newDeleteToken, hashToken, safeEqual, isUuid } from '../lib/krathong.js';
import { getStore } from '../lib/store.js';
import { allow, clientIp, hashIp } from '../lib/ratelimit.js';

export default async function handler(req, res) {
  try {
    const store = getStore();

    if (req.method === 'GET' && req.query?.ids) {
      const ids = [...new Set(String(req.query.ids).split(','))].filter(isUuid).slice(0, 50);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(ids.length ? await store.getMany(ids) : []);
    }

    if (req.method === 'GET') {
      const kind = req.query?.kind === 'lantern' ? 'lantern' : 'krathong';
      res.setHeader('Cache-Control', 'public, s-maxage=3, stale-while-revalidate=10');
      return res.status(200).json(await store.list(limit, kind));
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (JSON.stringify(body).length > 16000) return res.status(413).json({ error: 'ข้อมูลใหญ่เกินไป' });
      const { value, error } = validate(body);
      if (error) return res.status(400).json({ error });
      const ipHash = hashIp(clientIp(req));
      if (!(await allow(ipHash, store))) {
        return res.status(429).json({ error: 'ลอยกระทงถี่เกินไป ลองใหม่อีกครั้งในอีก 1 นาที' });
      }
      const deleteToken = newDeleteToken();
      await store.create(value, ipHash, hashToken(deleteToken));
      return res.status(201).json({ ...value, deleteToken });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!isUuid(id)) return res.status(400).json({ error: 'ไม่พบกระทงนี้' });
      const admin = process.env.ADMIN_TOKEN;
      const auth = String(req.headers.authorization || '');
      const isAdmin = Boolean(admin && admin.length >= 16 && safeEqual(auth, `Bearer ${admin}`));
      const found = await store.deleteHashOf(id);
      if (!found.exists) return res.status(404).json({ error: 'กระทงนี้ลอยหายไปแล้ว' });
      const token = req.headers['x-delete-token'];
      const isOwner = Boolean(token && found.deleteHash && safeEqual(hashToken(token), found.deleteHash));
      if (!isAdmin && !isOwner) return res.status(403).json({ error: 'ลบได้เฉพาะกระทงที่คุณลอยเองจากเครื่องนี้' });
      await store.remove(id);
      return res.status(200).json({ ok: true, id });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง' });
  }
}
