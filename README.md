# ลอยไปเลย 🪷

**Loy Pai Loei** — ลอยกระทงออนไลน์

เว็บประดิษฐ์และลอยกระทงออนไลน์ ผู้ใช้ลากวัสดุ (ดอกไม้ เทียน ธูป เหรียญ พวงมาลัย ฯลฯ) มาวางบนกระทงได้เหมือนเกมแต่งตัว ย่อ/ขยาย/หมุน/ย้ายได้ เลือกฐานและสีใบตอง เขียนคำอธิษฐาน แล้วปล่อยให้ลอยบนสายน้ำร่วมกับกระทงของคนอื่น แตะกระทงใดก็ได้เพื่ออ่านคำอธิษฐาน

**Stack:** React 18 + Vite (frontend) · Node.js + Express (API) · CSS ล้วน (ไม่ใช้ UI library)

## เริ่มใช้งาน

```bash
npm install
npm run dev        # API ที่ :3001 + เว็บที่ http://localhost:5173 (ไม่ต้องมีฐานข้อมูล ใช้ไฟล์ JSON)
# ทดสอบกับ Postgres จริง: DATABASE_URL=postgres://... npm run dev
```

Production:

```bash
npm run build      # สร้างไฟล์ไว้ที่ dist/
npm start          # Express เสิร์ฟทั้ง API และหน้าเว็บที่ http://localhost:3001
```

`npm run build:single` สร้างหน้าเว็บเป็นไฟล์ HTML ไฟล์เดียว (dist-single/) ใช้เป็นเดโมได้โดยไม่ต้องมีเซิร์ฟเวอร์ — กรณีนี้กระทงจะถูกเก็บในเบราว์เซอร์ของผู้ใช้แต่ละคน

## ขึ้นเว็บด้วย Vercel

โครงบน Vercel: หน้าเว็บ (Vite build → `dist/`) + API เป็น Vercel Functions ในโฟลเดอร์ `api/` + ฐานข้อมูล Postgres (Neon) + (ไม่บังคับ) Upstash Redis สำหรับกันสแปม + Vercel Blob สำหรับสำรองข้อมูลรายวัน

1. **อัปโค้ดขึ้น GitHub** (มี `.gitignore` ให้แล้ว)
2. **สร้างโปรเจกต์บน Vercel**: Add New → Project → เลือก repo → กด Deploy ได้เลย (ค่าต่าง ๆ อยู่ใน `vercel.json` แล้ว)
   ตอนนี้หน้าเว็บขึ้นแล้ว แต่ API จะตอบว่า "ยังไม่ได้เชื่อมฐานข้อมูล" จนกว่าจะทำข้อ 3
3. **เชื่อมฐานข้อมูล**: แท็บ Storage → Create Database → เลือก Neon (Postgres) → Connect กับโปรเจกต์นี้ทุก environment
   Vercel จะใส่ `DATABASE_URL` ให้เอง → ไปที่ Deployments → Redeploy
   ตาราง `krathongs` และกระทงตัวอย่างจะถูกสร้างอัตโนมัติในการเรียกครั้งแรก (ดูโครงสร้างได้ใน `lib/store.js`)
4. **กันสแปม (แนะนำเมื่อคนเยอะ)**: Storage → เพิ่ม Upstash (Redis) → Connect → Redeploy
   ถ้าไม่ทำข้อนี้ ระบบยังจำกัด 5 ใบ/นาที/IP ได้ โดยนับจากฐานข้อมูลแทน
5. **สำรองข้อมูลรายวัน**:
   - Storage → Create → Blob → Connect (จะได้ `BLOB_READ_WRITE_TOKEN`)
   - Settings → Environment Variables → เพิ่ม `CRON_SECRET` เป็นข้อความสุ่มยาว ๆ (16 ตัวขึ้นไป)
   - Redeploy → ระบบจะสำรองทุกวันเวลา 02:00 น. (เวลาไทย) ไปที่ `backups/` ใน Blob store
   - ดู/สั่งรันเองได้ที่ Settings → Cron Jobs
6. **(แนะนำ) ตั้ง `IP_SALT`** เป็นข้อความสุ่ม — ระบบเก็บแค่ค่าแฮชของ IP ไว้ใช้กันสแปม ไม่เก็บ IP จริง และไม่ส่งออกไปในไฟล์สำรอง
7. **โดเมน**: Settings → Domains → ใส่โดเมนของคุณ แล้วตั้ง DNS ตามที่ Vercel บอก

ตัวแปรทั้งหมดดูได้ใน `.env.example` — ชื่อตัวแปรที่ระบบรองรับ: `DATABASE_URL` หรือ `POSTGRES_URL`, `UPSTASH_REDIS_REST_URL`/`_TOKEN` หรือ `KV_REST_API_URL`/`_TOKEN`

> หมายเหตุ: แพ็กเกจฟรี (Hobby) ของ Vercel ใช้ได้กับงานส่วนตัวที่ไม่ใช่เชิงพาณิชย์ และฟีเจอร์/โควตาของ Vercel, Neon, Upstash เปลี่ยนได้ — เช็กหน้าราคาและเอกสารล่าสุดก่อนใช้งานจริง

### ขึ้นโฮสต์ Node ทั่วไป (ทางเลือก)
`npm install && npm run build` แล้ว `npm start` — ตั้ง `DATABASE_URL` เพื่อใช้ Postgres หรือไม่ตั้งก็ได้ (จะเก็บเป็นไฟล์ JSON ใน `DATA_DIR`, ค่าเริ่มต้น `server/data` ต้องเป็นดิสก์ถาวร)

## โครงสร้าง

```
api/krathongs.js             GET/POST กระทง (Vercel Function — ใช้กับ Express ในเครื่องด้วย)
api/stats.js                 จำนวนกระทงทั้งหมด
api/cron/backup.js           สำรองข้อมูลรายวันไป Vercel Blob
lib/krathong.js              กติกาตรวจข้อมูล + กระทงตัวอย่าง
lib/store.js                 ที่เก็บข้อมูล: Postgres (ถ้ามี DATABASE_URL) หรือไฟล์ JSON
lib/ratelimit.js             จำกัด 5 ใบ/นาที/IP: Upstash → Postgres → หน่วยความจำ
server/index.js              เซิร์ฟเวอร์ Express สำหรับพัฒนาในเครื่อง
vercel.json                  ตั้งค่า build, cron, cache
client/src/App.jsx           ฉากหลัก (ท้องฟ้า พระจันทร์ แม่น้ำ)
client/src/components/
  Krathong.jsx               กระทง SVG ที่ปรับแต่งได้
  River.jsx                  สายน้ำ + แอนิเมชันกระทงลอย
  Workshop.jsx               หน้าประดิษฐ์กระทงแบบลากวาง (drag & drop)
  WishDialog.jsx             อ่านคำอธิษฐาน
client/src/options.js        ตัวเลือกฐาน/ใบตอง
client/src/parts.jsx         วัสดุทั้งหมดที่ลากได้ (SVG) — เพิ่มชิ้นใหม่ได้ที่นี่
client/src/api.js            เรียก API (fallback เป็น localStorage)
client/src/styles.css        design tokens + สไตล์ทั้งหมด
client/src/bg.webp           ภาพพื้นหลังฉากลอยกระทง (WebP 2048px ~174KB)
```

## API

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/krathongs?limit=80` | รายการกระทงล่าสุด |
| POST | `/api/krathongs` | ลอยกระทงใหม่ `{ name, wish, base, petal, fold, items: [{ type, x, y, s, r }] }` |
| GET | `/api/stats` | จำนวนกระทงทั้งหมด |

มีการตรวจข้อมูลฝั่งเซิร์ฟเวอร์ (ความยาว, ตัวเลือกที่อนุญาต) และจำกัด 5 กระทง/นาที/IP

## ลายใบตองพับ

เลือกได้ 4 แบบในแท็บ "ฐานกระทง" (ฟิลด์ `fold`): พนมมือ (กลีบแหลมซ้อน 3 ชั้น), กลีบกุหลาบ (กลีบมนม้วนปลาย), เล็บมือนาง (กลีบเรียวเรียงถี่), หนามขนุน (หนามเล็กเรียงเป็นเกล็ด)
ทุกกลีบวาดแยกด้านเงา/ด้านรับแสง มีรอยพับ เส้นใบตองเฉียง และหมุดกลัดที่ชั้นหน้า — ปรับรูปแบบได้ที่ `FOLD_LAYOUTS` ใน `Krathong.jsx`

## หน้าประดิษฐ์กระทง

- **ลาก** วัสดุจากถาดมาวางบนผิวกระทง (เส้นประจะแสดงพื้นที่ที่วางได้) — ใช้ได้ทั้งเมาส์และนิ้ว
- **แตะ** วัสดุในถาดเพื่อวางทันที (สำหรับคนที่ลากไม่สะดวก)
- **ลากชิ้นที่วางแล้ว** เพื่อย้าย ลากออกนอกกระทง = หล่นลงน้ำ (กด "เลิกทำ" ได้)
- แถบเครื่องมือ: ย่อ ขยาย หมุน ไว้หน้าสุด เอาออก, ปุ่ม "จัดให้" สุ่มจัดกระทงให้
- คีย์บอร์ด: Tab เลือกชิ้น, ลูกศรเลื่อน (Shift = เลื่อนไกล), `+` `-` ย่อขยาย, `[` `]` หมุน, Delete เอาออก
- ใส่ได้สูงสุด 30 ชิ้น (ตรวจซ้ำที่ server)

### เพิ่มวัสดุใหม่
1. เพิ่มใน `PARTS` ที่ `client/src/parts.jsx` (วาด SVG โดยให้ (0,0) เป็นฐานของชิ้น)
2. เพิ่มชื่อ type ใน `PART_TYPES` ที่ `lib/krathong.js`

## โหมด 8-bit

กดปุ่ม "โหมด 8-bit" / "โหมดสมจริง" ที่แถบล่างหรือในหน้าประดิษฐ์ (จำค่าไว้ในเบราว์เซอร์)

- `client/src/pixel.jsx` วาดกระทง SVG ลงผืนพิกเซลเล็ก (48px บนแม่น้ำ, 64px ในหน้าประดิษฐ์) แล้วลดสีเหลือพาเลตคอนโซล 8-bit 54 สี + ขอบดำแบบสไปรต์ — วัสดุใหม่ที่เพิ่มใน `parts.jsx` จะกลายเป็นพิกเซลให้อัตโนมัติ
- `client/src/bg-pixel.png` ภาพพื้นหลังย่อเหลือ 384px ลดเหลือ 40 สี แสดงด้วย `image-rendering: pixelated`
- สไตล์ทั้งหมดอยู่ใต้ `html[data-style="pixel"]` ใน styles.css

## ต่อยอด

- เปลี่ยนที่เก็บจาก JSON เป็น SQLite / MongoDB / PostgreSQL ใน `load()` / `save()`
- ใช้ Socket.IO หรือ SSE แทนการ poll ทุก 15 วินาที เพื่อให้เห็นกระทงใหม่แบบเรียลไทม์
- เพิ่มฐานกระทงแบบใหม่: เพิ่มใน `options.js` + `ALLOWED` ใน lib/krathong.js + ลวดลายใน `Krathong.jsx`
- เพิ่มระบบกรองคำไม่สุภาพก่อนบันทึกคำอธิษฐาน

## การออกแบบ

- พื้นหลังเป็นภาพ `bg.webp` จัดตำแหน่งให้แม่น้ำ (31% ล่างของจอ) ตรงกับผิวน้ำในภาพทุกขนาดจอ ถ้าเปลี่ยนภาพ ให้ปรับ `background-position` ของ `.scene` และความสูงของ `.river` ใน styles.css
- ธีมสว่าง = แผงกระดาษสีครีม, ธีมมืด = แผงสีน้ำเงินคืนเพ็ญ (ตามการตั้งค่าเครื่อง)
- ฟอนต์ Torsilp ThaiMai (`client/src/fonts/TorsilpThaiMai.woff2`) สำหรับหัวเรื่อง ปุ่ม ป้าย และคำอธิษฐาน; เนื้อความยาวใช้ Anuphan / Kanit — ฟอนต์นี้มีเฉพาะอักษรไทย ตัวเลข เครื่องหมาย อักษรอังกฤษจะใช้ฟอนต์สำรอง (Kanit หรือ Press Start 2P ในโหมด 8-bit)
- ปุ่มแตะได้ ≥ 44px, focus ring ชัด, รองรับคีย์บอร์ด, ปุ่ม "หยุดสายน้ำ" และ `prefers-reduced-motion`
