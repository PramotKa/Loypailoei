// สำรองข้อมูลรายวัน: Vercel Cron เรียก /api/cron/backup ตามเวลาใน vercel.json
// ส่งออกกระทงทั้งหมดเป็นไฟล์ JSON ไปเก็บที่ Vercel Blob (ต้องสร้าง Blob store ให้โปรเจกต์ก่อน)
import { getStore } from '../../lib/store.js';

export default async function handler(req, res) {
  // Vercel แนบ "Authorization: Bearer <CRON_SECRET>" มากับ cron ให้เอง — กันคนนอกมาเรียก
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'ยังไม่ได้เชื่อม Vercel Blob (BLOB_READ_WRITE_TOKEN)' });
  }
  try {
    const { put } = await import('@vercel/blob');
    const all = await getStore().all();
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = await put(`backups/krathongs-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), count: all.length, krathongs: all }), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true, count: all.length, url: blob.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'สำรองข้อมูลไม่สำเร็จ' });
  }
}
