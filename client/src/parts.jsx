import { useId } from 'react';
import { Pixelated, useStyleMode } from './pixel.jsx';

// วัสดุที่ลากมาวางบนกระทงได้ — ทุกชิ้นวาดโดยให้จุด (0,0) อยู่ที่ "ฐาน" ของชิ้น
// draw(u) รับฟังก์ชัน u('ชื่อ') คืนค่า url(#gradient) ที่ประกาศไว้ใน <PartDefs>
export const CATEGORIES = [
  { id: 'base', label: 'ฐานกระทง' },
  { id: 'flower', label: 'ดอกไม้' },
  { id: 'offering', label: 'เครื่องบูชา' },
  { id: 'decor', label: 'ตกแต่ง' }
];

/** id ที่ไม่ซ้ำกันต่อ svg หนึ่งอัน + ฟังก์ชันอ้างอิง gradient */
export function useArtId() {
  const uid = 'k' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return [uid, (n) => `url(#${uid}${n})`];
}

const R = ({ id, stops, ...rest }) => (
  <radialGradient id={id} {...rest}>
    {stops.map(([o, c, a = 1]) => <stop key={o} offset={o} stopColor={c} stopOpacity={a} />)}
  </radialGradient>
);
const L = ({ id, stops, ...rest }) => (
  <linearGradient id={id} {...rest}>
    {stops.map(([o, c, a = 1]) => <stop key={o} offset={o} stopColor={c} stopOpacity={a} />)}
  </linearGradient>
);

/** gradient ทั้งหมดของวัสดุ — วางไว้ใน <defs> ของ svg */
export function PartDefs({ p }) {
  return (
    <>
      <R id={p + 'mg'} cx=".4" cy=".35" r=".7" stops={[[0, '#FFE08A'], [.45, '#F8A21A'], [1, '#C4520A']]} />
      <R id={p + 'mgc'} cx=".4" cy=".4" r=".6" stops={[[0, '#F09A2A'], [1, '#8A3A05']]} />
      <R id={p + 'rs'} cx=".38" cy=".32" r=".75" stops={[[0, '#FF8A8A'], [.45, '#D92638'], [1, '#6E0B18']]} />
      <R id={p + 'js'} cx=".5" cy=".35" r=".7" stops={[[0, '#FFFFFF'], [.7, '#F6F0E0'], [1, '#D8CDAF']]} />
      <R id={p + 'oc'} cx=".5" cy=".3" r=".75" stops={[[0, '#F7E6FF'], [.5, '#CE95EE'], [1, '#8547B8']]} />
      <L id={p + 'lt'} x1="0" y1="1" x2="0" y2="0" stops={[[0, '#FFF3F6'], [.5, '#F5A3BD'], [1, '#C93D6E']]} />
      <R id={p + 'gb'} cx=".38" cy=".32" r=".75" stops={[[0, '#F48AD0'], [.5, '#A8237E'], [1, '#540C3E']]} />
      <L id={p + 'cd'} x1="0" y1="0" x2="1" y2="0" stops={[[0, '#CDB98E'], [.35, '#FFFBEF'], [.7, '#F2E4C2'], [1, '#BFA877']]} />
      <R id={p + 'fl'} cx=".5" cy=".75" r=".6" stops={[[0, '#FFFFFF'], [.25, '#FFF3A6'], [.6, '#FFB12E'], [1, '#FF5A00', .15]]} />
      <R id={p + 'fg'} cx=".5" cy=".5" r=".5" stops={[[0, '#FFD27A', .7], [.4, '#FFC861', .28], [1, '#FFB547', 0]]} />
      <R id={p + 'em'} cx=".5" cy=".5" r=".5" stops={[[0, '#FFF0A0'], [.45, '#FF6A1F'], [1, '#FF3D00', 0]]} />
      <L id={p + 'cn'} x1="0" y1="0" x2="1" y2="1" stops={[[0, '#FFF2B8'], [.35, '#E7B84A'], [.7, '#A7771C'], [1, '#F2D27A']]} />
      <L id={p + 'lf'} x1="0" y1="1" x2="1" y2="0" stops={[[0, '#1F4D25'], [.5, '#3F8540'], [1, '#8CC873']]} />
      <R id={p + 'cr'} cx=".5" cy=".4" r=".7" stops={[[0, '#FFFFFF'], [.6, '#DDD3F3'], [1, '#9F8ED1']]} />
      <R id={p + 'gw'} cx=".35" cy=".3" r=".75" stops={[[0, '#FFFFFF'], [1, '#D9CFB1']]} />
      <R id={p + 'gr'} cx=".35" cy=".3" r=".75" stops={[[0, '#FF9A9A'], [.5, '#D42435'], [1, '#7A0E18']]} />
      <R id={p + 'sh'} cx=".5" cy=".5" r=".5" stops={[[0, '#1A1208', .45], [1, '#1A1208', 0]]} />
    </>
  );
}

const deg = (a) => (a * Math.PI) / 180;
const ring = (n, start = 0) => Array.from({ length: n }, (_, i) => start + (360 / n) * i);

export const PARTS = {
  marigold: {
    label: 'ดาวเรือง', cat: 'flower', h: 20, w: 10,
    draw: (u) => (
      <g>
        {ring(13).map(a => (
          <circle key={`o${a}`} cx={Math.cos(deg(a)) * 7} cy={-9 + Math.sin(deg(a)) * 6.2} r="3.6" fill={u('mg')} stroke="#9A4208" strokeOpacity=".35" strokeWidth=".5" />
        ))}
        {ring(9, 20).map(a => (
          <circle key={`m${a}`} cx={Math.cos(deg(a)) * 4.3} cy={-9.6 + Math.sin(deg(a)) * 3.8} r="3.3" fill={u('mg')} stroke="#9A4208" strokeOpacity=".3" strokeWidth=".5" />
        ))}
        <circle cy="-10" r="2.8" fill={u('mgc')} />
      </g>
    )
  },
  rose: {
    label: 'กุหลาบ', cat: 'flower', h: 20, w: 10,
    draw: (u) => (
      <g>
        <path d="M-11 -1 Q-14 -8 -6 -7 Q-8 -3 -11 -1 Z" fill={u('lf')} />
        <path d="M11 -1 Q14 -8 6 -7 Q8 -3 11 -1 Z" fill={u('lf')} />
        <circle cy="-9" r="8.6" fill={u('rs')} />
        <path d="M-7 -6 Q-8 -14 0 -16 Q7 -15 7 -8" stroke="#5A0712" strokeOpacity=".55" strokeWidth=".9" fill="none" />
        <path d="M-4 -9 A4 4 0 1 1 1 -5 A2.4 2.4 0 1 1 1.6 -10.4" stroke="#5A0712" strokeOpacity=".7" fill="none" strokeWidth="1" />
        <path d="M-6 -12 Q-3 -15 1 -14" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth=".8" fill="none" />
      </g>
    )
  },
  jasmine: {
    label: 'มะลิ', cat: 'flower', h: 20, w: 8,
    draw: (u) => (
      <g>
        {ring(5, -90).map(a => (
          <ellipse key={a} cx="0" cy="-13" rx="3.3" ry="5.2" transform={`rotate(${a + 90} 0 -8)`} fill={u('js')} stroke="#A89A72" strokeOpacity=".5" strokeWidth=".5" />
        ))}
        <circle cy="-8" r="2" fill="#E6C25A" />
        <circle cy="-8.4" r=".8" fill="#FFF4C2" />
      </g>
    )
  },
  orchid: {
    label: 'กล้วยไม้', cat: 'flower', h: 22, w: 9,
    draw: (u) => (
      <g>
        {ring(5, -90).map(a => (
          <ellipse key={a} cx="0" cy="-16" rx="3.9" ry="6.2" transform={`rotate(${a + 90} 0 -10)`} fill={u('oc')} stroke="#6A3398" strokeOpacity=".35" strokeWidth=".5" />
        ))}
        <path d="M-3.6 -7 Q0 -1 3.6 -7 Q0 -9.5 -3.6 -7 Z" fill="#7A2C96" />
        <path d="M-2 -6.6 Q0 -4 2 -6.6" stroke="#E9B6FF" strokeWidth=".6" fill="none" />
        <ellipse cy="-10.2" rx="1.4" ry="1.8" fill="#F5D76E" />
      </g>
    )
  },
  lotus: {
    label: 'บัวตูม', cat: 'flower', h: 34, w: 8,
    draw: (u) => (
      <g>
        <path d="M0 0 C-7 -3 -13 -9 -11 -17 C-7 -10 -3 -5 0 0 Z" fill={u('lt')} />
        <path d="M0 0 C7 -3 13 -9 11 -17 C7 -10 3 -5 0 0 Z" fill={u('lt')} />
        <path d="M0 0 C-10 -8 -9 -22 0 -32 C9 -22 10 -8 0 0 Z" fill={u('lt')} />
        <path d="M0 -1 C-3 -10 -3 -20 0 -29 M-4 -4 C-7 -12 -5 -20 -2 -26 M4 -4 C7 -12 5 -20 2 -26" stroke="#B23A64" strokeOpacity=".3" strokeWidth=".6" fill="none" />
        <path d="M-3 -24 C-4 -18 -4 -12 -2 -7" stroke="#FFFFFF" strokeOpacity=".4" strokeWidth=".9" fill="none" />
      </g>
    )
  },
  globe: {
    label: 'บานไม่รู้โรย', cat: 'flower', h: 18, w: 7,
    draw: (u) => (
      <g>
        <path d="M0 0 L-7 -3 L-3 -4 Z M0 0 L7 -3 L3 -4 Z" fill={u('lf')} />
        <circle cy="-8" r="6.6" fill={u('gb')} />
        {[[-2, -11], [2, -8], [-1, -6], [3, -11.5], [-3.6, -8], [0, -12.6], [1.5, -4.5]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r=".9" fill="#F7A6DB" opacity=".8" />
        ))}
      </g>
    )
  },
  candle: {
    label: 'เทียน', cat: 'offering', h: 66, w: 7,
    draw: (u) => (
      <g>
        <circle className="halo" cy="-52" r="30" fill={u('fg')} pointerEvents="none" />
        <rect x="-5" y="-38" width="10" height="38" rx="1.5" fill={u('cd')} />
        <ellipse cy="-38" rx="5" ry="1.6" fill="#FFF8E6" stroke="#D8C49A" strokeWidth=".5" />
        <path d="M3 -38 Q4.2 -33 3.4 -29 Q2.6 -31 2.4 -37 Z" fill="#FFF8E6" opacity=".9" />
        <line x1="0" y1="-38.5" x2="0.4" y2="-42.5" stroke="#2A1A0E" strokeWidth="1.2" strokeLinecap="round" />
        <g className="flame">
          <path d="M0 -64 C6.5 -55 7.5 -47 0 -41.5 C-7.5 -47 -6.5 -55 0 -64 Z" fill={u('fl')} />
          <path d="M0 -51 C2 -48 2 -45 0 -43 C-2 -45 -2 -48 0 -51 Z" fill="#5B8CFF" opacity=".35" />
        </g>
      </g>
    )
  },
  incense: {
    label: 'ธูป', cat: 'offering', h: 64, w: 6,
    draw: (u) => (
      <g>
        <path className="smoke" d="M-8 -54 C-14 -62 -2 -66 -8 -76 C-12 -82 -6 -86 -9 -92" stroke="#E7ECF7" strokeOpacity=".45" strokeWidth="1.1" fill="none" />
        <path className="smoke smoke--late" d="M8 -54 C14 -62 2 -66 8 -76 C12 -82 6 -86 9 -92" stroke="#E7ECF7" strokeOpacity=".45" strokeWidth="1.1" fill="none" />
        {[[-3, -8, -52], [0, 0, -56], [3, 8, -52]].map(([b, t, y]) => (
          <g key={t}>
            <line x1={b} y1="0" x2={t} y2={y} stroke="#6E2617" strokeWidth="2" strokeLinecap="round" />
            <line x1={b - .4} y1="-2" x2={t - .4} y2={y + 2} stroke="#B4553A" strokeWidth=".6" strokeLinecap="round" />
            <circle cx={t} cy={y} r="3" fill={u('em')} />
          </g>
        ))}
      </g>
    )
  },
  coin: {
    label: 'เหรียญ', cat: 'offering', h: 12, w: 9,
    draw: (u) => (
      <g>
        <ellipse cy="-2.6" rx="8" ry="3.6" fill="#8E6416" />
        <ellipse cy="-4.6" rx="8" ry="3.6" fill={u('cn')} />
        <ellipse cy="-4.6" rx="5" ry="2.1" fill="none" stroke="#7E5810" strokeOpacity=".6" strokeWidth=".6" />
        <path d="M-5 -6.6 Q-1 -7.9 3 -7.4" stroke="#FFFBE0" strokeOpacity=".8" strokeWidth=".7" fill="none" />
      </g>
    )
  },
  leaf: {
    label: 'ใบไม้', cat: 'decor', h: 32, w: 6,
    draw: (u) => (
      <g>
        <path d="M0 0 C-9 -10 -6 -24 5 -31 C9 -18 7 -8 0 0 Z" fill={u('lf')} />
        <path d="M0 0 C1 -10 3 -20 5 -29" stroke="#CFE8B8" strokeOpacity=".55" fill="none" strokeWidth=".7" />
        {[-8, -14, -20].map(y => (
          <path key={y} d={`M${1 + (y + 8) * -0.15} ${y} q-3 -1 -4.5 -4 M${1.6 + (y + 8) * -0.15} ${y - 1} q3 -2 3.6 -5`} stroke="#CFE8B8" strokeOpacity=".35" fill="none" strokeWidth=".5" />
        ))}
      </g>
    )
  },
  crown: {
    label: 'ดอกรัก', cat: 'decor', h: 20, w: 9,
    draw: (u) => (
      <g>
        {[[-5, -6], [5, -6], [0, -13]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            {ring(5, -90).map(a => (
              <ellipse key={a} cx={x} cy={y - 3} rx="1.7" ry="3.1" transform={`rotate(${a + 90} ${x} ${y})`} fill={u('cr')} />
            ))}
            <circle cx={x} cy={y} r="1.7" fill="#8C73C9" />
            <circle cx={x - .4} cy={y - .4} r=".6" fill="#E8E0FF" />
          </g>
        ))}
      </g>
    )
  },
  garland: {
    label: 'พวงมาลัย', cat: 'decor', h: 30, w: 13,
    draw: (u) => (
      <g>
        <path d="M-12 -14 Q0 -30 12 -14" stroke="#6E8F4E" strokeWidth="1" fill="none" />
        {ring(14).filter(a => a <= 180).map((a, i) => (
          <circle key={a} cx={Math.cos(deg(a)) * 12} cy={-14 + Math.sin(deg(a)) * 11} r="3.3" fill={i % 3 === 1 ? u('gr') : u('gw')} />
        ))}
        <circle cy="-26" r="3.5" fill={u('mg')} />
      </g>
    )
  }
};

export const PART_TYPES = Object.keys(PARTS);

export function PartThumb({ type, size = 44 }) {
  const { pixel } = useStyleMode();
  if (!pixel) return <PartArt type={type} size={size} />;
  return <Pixelated cacheKey={`part:${type}`} res={24} width={size}><PartArt type={type} size={size} /></Pixelated>;
}

function PartArt({ type, size }) {
  const [uid, u] = useArtId();
  const p = PARTS[type];
  const h = Math.max(p.h, 24) + 6;
  const w = Math.max(h, 30);
  return (
    <svg viewBox={`${-w / 2} ${-h} ${w} ${h + 4}`} width={size} height={size} aria-hidden="true" focusable="false">
      <defs><PartDefs p={uid} /></defs>
      {p.draw(u)}
    </svg>
  );
}

export function partTransform(it) {
  return `translate(${it.x} ${it.y}) rotate(${it.r || 0}) scale(${it.s || 1})`;
}

/** เงาสัมผัสใต้ชิ้นวัสดุ ทำให้ดูวางอยู่บนผิวกระทงจริง */
export function PartShadow({ type, u }) {
  const w = PARTS[type]?.w || 8;
  return <ellipse cx="0" cy="0" rx={w * 1.1} ry="2.6" fill={u('sh')} />;
}
