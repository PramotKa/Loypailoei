// GET /api/stats → จำนวนกระทงทั้งหมด
import { getStore } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    return res.status(200).json({ total: await getStore().count() });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'เซิร์ฟเวอร์ขัดข้อง' });
  }
}
