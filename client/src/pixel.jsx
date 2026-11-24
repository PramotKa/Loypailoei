import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ===== โหมดสไตล์: 'pixel' (8-bit) หรือ 'real' (สมจริง) =====
const STYLE_KEY = 'loykrathong:style';
export const StyleContext = createContext({ pixel: false, toggle: () => {} });
export const useStyleMode = () => useContext(StyleContext);

export function useStyleState() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(STYLE_KEY) || 'pixel'; } catch { return 'pixel'; }
  });
  useEffect(() => {
    document.documentElement.dataset.style = mode;
    try { localStorage.setItem(STYLE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);
  return { pixel: mode === 'pixel', toggle: () => setMode(m => (m === 'pixel' ? 'real' : 'pixel')) };
}

// ===== พาเลตคอนโซล 8-bit (ชุดสีแบบ NES 54 สี) =====
const PALETTE = ('000000 FCFCFC BCBCBC 7C7C7C A4E4FC 3CBCFC 0078F8 0000FC B8B8F8 6888FC 0058F8 0000BC D8B8F8 9878F8 6844FC 4428BC ' +
  'F8B8F8 F878F8 D800CC 940084 F8A4C0 F85898 E40058 A80020 F0D0B0 F87858 F83800 A81000 FCE0A8 FCA044 E45C10 881400 ' +
  'F8D878 F8B800 AC7C00 503000 D8F878 B8F818 00B800 007800 B8F8B8 58D854 00A800 006800 B8F8D8 58F898 00A844 005800 ' +
  '00FCFC 00E8D8 008888 004058 F8D8F8 787878').split(' ').map(h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)));

// ระยะห่างสีแบบ "redmean" ใกล้เคียงการรับรู้ของตาคน
function nearest(r, g, b) {
  let best = PALETTE[0], bd = Infinity;
  for (const c of PALETTE) {
    const rm = (r + c[0]) / 2, dr = r - c[0], dg = g - c[1], db = b - c[2];
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

/** วาด svg ลงผืนพิกเซลเล็ก ๆ แล้วลดสีให้เหลือพาเลต 8-bit — คืนค่า data URL */
export async function rasterize(svgEl, w) {
  const clone = svgEl.cloneNode(true);
  // แสงฟุ้ง/ควันโปร่งแสงทำให้สีเพี้ยนเมื่อลดสี จึงตัดออก
  clone.querySelectorAll('.part__ring, .zone, .halo, .smoke').forEach(n => n.remove());
  const vb = svgEl.viewBox.baseVal;
  const h = Math.round(w * vb.height / vb.width);
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 110) { px[i + 3] = 0; continue; }
    // ย่อภาพทำให้สีปนกันจนหม่น — เร่งความสดก่อนเลือกสีจากพาเลต
    const m = (px[i] + px[i + 1] + px[i + 2]) / 3;
    const sat = (v) => Math.max(0, Math.min(255, m + (v - m) * 1.7));
    const [r, g, b] = nearest(sat(px[i]), sat(px[i + 1]), sat(px[i + 2]));
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
  // ขอบดำ 1 พิกเซลรอบรูป แบบสไปรต์เกม
  const alpha = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : px[(y * w + x) * 4 + 3];
  const out = new Uint8ClampedArray(px);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (px[i + 3] === 0 && (alpha(x - 1, y) || alpha(x + 1, y) || alpha(x, y - 1) || alpha(x, y + 1))) {
      out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 255;
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
  return c.toDataURL();
}

const cache = new Map();

/** แสดง children (svg) เป็นภาพพิกเซล — ใช้ cacheKey เพื่อไม่ต้องวาดซ้ำ */
export function Pixelated({ cacheKey, res = 48, width, ratio = 1, children, className = '' }) {
  const key = `${res}|${cacheKey}`;
  const [src, setSrc] = useState(() => cache.get(key));
  const holder = useRef(null);

  useEffect(() => {
    const hit = cache.get(key);
    if (hit) { setSrc(hit); return; }
    setSrc(undefined);
    let alive = true;
    const id = requestAnimationFrame(() => {
      const svg = holder.current?.querySelector('svg');
      if (!svg) return;
      rasterize(svg, res).then(u => { cache.set(key, u); if (alive) setSrc(u); }).catch(() => {});
    });
    return () => { alive = false; cancelAnimationFrame(id); };
  }, [key, res]);

  const style = { width, height: width * ratio };
  if (src) return <img className={`px-img ${className}`} src={src} alt="" draggable="false" style={style} />;
  return <span ref={holder} className="px-holder" style={style} aria-hidden="true">{children}</span>;
}
