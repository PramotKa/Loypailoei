// เซิร์ฟเวอร์สำหรับพัฒนาในเครื่อง (และใช้กับโฮสต์ Node ทั่วไปได้)
// เรียก handler ชุดเดียวกับที่ใช้บน Vercel
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import krathongs from '../api/krathongs.js';
import stats from '../api/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3001;

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.all('/api/krathongs', krathongs);
app.get('/api/stats', stats);

if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`ลอยไปเลย (Loi Pai Loei) API พร้อมที่ http://localhost:${PORT}`));
