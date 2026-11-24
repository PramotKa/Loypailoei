import { BASES, PETALS, FOLDS } from '../options.js';
import { PARTS, PartDefs, PartShadow, partTransform, useArtId } from '../parts.jsx';
import { Pixelated, useStyleMode } from '../pixel.jsx';

const BLOOMS = [[80, 98], [120, 98], [92, 92], [108, 92], [100, 100], [86, 104], [114, 104], [100, 86]];

// พื้นที่วางวัสดุ = ผิวด้านบนของกระทง
export const ZONE = { cx: 100, cy: 112, rx: 76, ry: 24 };
export const inZone = (x, y) => ((x - ZONE.cx) / ZONE.rx) ** 2 + ((y - ZONE.cy) / ZONE.ry) ** 2 <= 1;

// ผสมสี hex กับสีเป้าหมาย t = 0..1
export function mixHex(hex, target, t) { return mix(hex, target, t); }
function mix(hex, target, t) {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex), b = p(target);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// กระทงรุ่นเก่า (ไม่มี items) แปลงเป็นชิ้นวัสดุ
export function itemsOf(k) {
  if (Array.isArray(k.items)) return k.items;
  const items = BLOOMS.map(([x, y]) => ({ type: k.flower || 'marigold', x, y: y + 9, s: 1, r: 0 }));
  if (k.incense) items.unshift({ type: 'incense', x: 84, y: 100, s: 0.9, r: -4 });
  if (k.candle) items.push({ type: 'candle', x: 110, y: 96, s: 1, r: 0 });
  return items;
}

/** ใบตองพับหนึ่งกลีบ: ครึ่งซ้ายอยู่ในเงา ครึ่งขวารับแสง มีรอยพับ เส้นใบตองเฉียง และหมุดกลัด */
export function Leaf({ x, tip, bottom, half, fillL, fillR, edge, round = false, pin = false, veins = 3 }) {
  const h = bottom - tip, mid = tip + h / 2;
  const lc = round ? `C${x - half * 1.2} ${mid - h * .15} ${x - half * .7} ${tip} ${x} ${tip}` : `Q${x - half * .55} ${mid} ${x} ${tip}`;
  const rc = round ? `C${x + half * .7} ${tip} ${x + half * 1.2} ${mid - h * .15} ${x + half} ${bottom}` : `Q${x + half * .55} ${mid} ${x + half} ${bottom}`;
  return (
    <g>
      <path d={`M${x - half} ${bottom} ${lc} L${x} ${bottom} Z`} fill={fillL} />
      <path d={`M${x} ${tip} ${rc} L${x} ${bottom} Z`} fill={fillR} />
      {/* เส้นใบตอง: ขนานกันเฉียงลงจากรอยพับ เหมือนเส้นใบกล้วยจริง */}
      {Array.from({ length: veins }, (_, i) => {
        const y = tip + h * (i + 1) / (veins + 1);
        const w = half * (0.25 + 0.55 * (y - tip) / h);
        return (
          <g key={i}>
            <path d={`M${x + .6} ${y} L${x + w} ${y + h * .13}`} stroke={edge} strokeOpacity=".28" strokeWidth=".45" />
            <path d={`M${x - .6} ${y} L${x - w} ${y + h * .13}`} stroke="#000" strokeOpacity=".18" strokeWidth=".45" />
          </g>
        );
      })}
      <path d={`M${x - half} ${bottom} ${lc} ${rc}`} fill="none" stroke={edge} strokeOpacity=".6" strokeWidth=".8" />
      {round
        ? <path d={`M${x - half * .55} ${bottom - 2} C${x - half * .75} ${mid} ${x - half * .3} ${tip + 3} ${x + half * .2} ${tip + h * .22}`} stroke="#FFFFFF" strokeOpacity=".4" strokeWidth=".8" fill="none" />
        : <path d={`M${x + .4} ${tip + 2} L${x + .4} ${bottom - 2}`} stroke="#FFFFFF" strokeOpacity=".4" strokeWidth=".8" />}
      {pin && (
        <g>
          <circle cx={x} cy={bottom - 3.2} r="1.15" fill="#EFE8D8" stroke="#5B4A33" strokeOpacity=".7" strokeWidth=".35" />
          <circle cx={x - .35} cy={bottom - 3.55} r=".35" fill="#FFFFFF" />
        </g>
      )}
    </g>
  );
}

const span = (from, to, step) => { const a = []; for (let x = from; x <= to + .01; x += step) a.push(+x.toFixed(1)); return a; };
const curve = (x) => (1 - Math.min(1, ((x - 100) / 60) ** 2)) * 6;

/** ลายใบตองพับแต่ละแบบ: ชั้นหลัง (ตั้งขึ้นหลังขอบกระทง) และชั้นหน้า (หุ้มข้างกระทง) */
export const FOLD_LAYOUTS = {
  phanom: {
    back: [
      ...span(40, 160, 13.3).map(x => ({ x, tip: 58 + Math.abs(x - 100) * .34, bottom: 117, half: 13 })),
      ...span(40, 160, 13.3).map(x => ({ x, tip: 70 + Math.abs(x - 100) * .3, bottom: 117, half: 8.5, veins: 2 })),
      ...span(40, 160, 13.3).map(x => ({ x, tip: 82 + Math.abs(x - 100) * .26, bottom: 117, half: 4.5, veins: 1 }))
    ],
    front: [
      ...span(47, 157, 15.7).map(x => ({ x, tip: 122, bottom: 141 + curve(x), half: 9.5, veins: 2 })),
      ...span(47, 157, 15.7).map(x => ({ x, tip: 129, bottom: 141 + curve(x), half: 5.5, veins: 1, pin: true }))
    ]
  },
  rose: {
    back: [
      ...span(40, 160, 13.3).map(x => ({ x, tip: 66 + Math.abs(x - 100) * .3, bottom: 117, half: 12.5, round: true })),
      ...span(46.7, 153.3, 13.3).map(x => ({ x, tip: 82 + Math.abs(x - 100) * .24, bottom: 117, half: 10, round: true, veins: 2 }))
    ],
    front: [
      ...span(45, 155, 13.75).map(x => ({ x, tip: 123, bottom: 141 + curve(x), half: 9, round: true, veins: 2, pin: true }))
    ]
  },
  nail: {
    back: [
      ...span(36, 164, 7.1).map(x => ({ x, tip: 52 + Math.abs(x - 100) * .38, bottom: 117, half: 4.8, veins: 4 })),
      ...span(39.5, 160.5, 7.1).map(x => ({ x, tip: 74 + Math.abs(x - 100) * .3, bottom: 117, half: 4.2, veins: 3 }))
    ],
    front: [
      ...span(42, 158, 7.25).map(x => ({ x, tip: 121, bottom: 141 + curve(x), half: 4.6, veins: 2 })),
      ...span(45.6, 154.4, 14.5).map(x => ({ x, tip: 134, bottom: 141 + curve(x), half: 2.6, veins: 0, pin: true }))
    ]
  },
  thorn: {
    back: [
      ...span(38, 162, 8).map(x => ({ x, tip: 92 + Math.abs(x - 100) * .16, bottom: 114 + Math.abs(x - 100) * .05, half: 5.4, veins: 1 })),
      ...span(42, 158, 8).map(x => ({ x, tip: 82 + Math.abs(x - 100) * .2, bottom: 104 + Math.abs(x - 100) * .08, half: 5, veins: 1 })),
      ...span(46, 154, 8).map(x => ({ x, tip: 72 + Math.abs(x - 100) * .24, bottom: 94 + Math.abs(x - 100) * .12, half: 4.6, veins: 1 })),
      ...span(50, 150, 8).map(x => ({ x, tip: 62 + Math.abs(x - 100) * .28, bottom: 84 + Math.abs(x - 100) * .16, half: 4.2, veins: 1 }))
    ].reverse(),
    front: [
      ...span(40, 160, 8).map(x => ({ x, tip: 120 + curve(x) * .5, bottom: 132 + curve(x) * .8, half: 5, veins: 1 })),
      ...span(44, 156, 8).map(x => ({ x, tip: 129 + curve(x) * .8, bottom: 141 + curve(x), half: 5, veins: 1 }))
    ]
  }
};

const SIDE = 'M28 116 Q100 104 172 116 L163 140 Q100 156 37 140 Z';

export function KrathongSvg({ base = 'banana', petal = 'leaf', fold = 'phanom', size, svgRef, className = '', children, onPointerDown, interactive = false, art }) {
  const own = useArtId();
  const [uid, u] = art || own;
  const b = BASES[base] || BASES.banana;
  const p = PETALS[petal] || PETALS.leaf;
  const layout = FOLD_LAYOUTS[fold] || FOLD_LAYOUTS.phanom;

  return (
    <svg ref={svgRef} className={`krathong-svg ${className}`} viewBox="0 0 200 170"
      width={size} height={size ? size * 0.85 : undefined}
      aria-hidden={interactive ? undefined : 'true'} role={interactive ? 'group' : undefined} aria-label={interactive ? 'กระทงของคุณ' : undefined}
      focusable="false" onPointerDown={onPointerDown} overflow="visible">
      <defs>
        <PartDefs p={uid} />
        <linearGradient id={uid + 'pl'} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={mix(p.edge, '#000000', .35)} />
          <stop offset=".55" stopColor={mix(p.edge, '#000000', .08)} />
          <stop offset="1" stopColor={mix(p.color, '#000000', .05)} />
        </linearGradient>
        <linearGradient id={uid + 'pr'} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={mix(p.color, '#000000', .2)} />
          <stop offset=".5" stopColor={p.color} />
          <stop offset="1" stopColor={mix(p.color, '#FFFFFF', .38)} />
        </linearGradient>
        <radialGradient id={uid + 'tp'} cx=".42" cy=".35" r=".7">
          <stop offset="0" stopColor={mix(b.top, '#FFFFFF', .4)} />
          <stop offset=".65" stopColor={b.top} />
          <stop offset="1" stopColor={mix(b.top, '#000000', .2)} />
        </radialGradient>
        <linearGradient id={uid + 'sd'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(b.body, '#FFFFFF', .18)} />
          <stop offset="1" stopColor={mix(b.body, '#000000', .38)} />
        </linearGradient>
        <linearGradient id={uid + 'sdh'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".42" />
          <stop offset=".22" stopColor="#000" stopOpacity="0" />
          <stop offset=".45" stopColor="#FFF" stopOpacity=".12" />
          <stop offset=".72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id={uid + 'wl'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B3768" stopOpacity="0" />
          <stop offset=".45" stopColor="#1B3768" stopOpacity=".35" />
          <stop offset="1" stopColor="#0E2148" stopOpacity=".8" />
        </linearGradient>
        <radialGradient id={uid + 'ws'} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#050A1E" stopOpacity=".55" />
          <stop offset="1" stopColor="#050A1E" stopOpacity="0" />
        </radialGradient>
        <clipPath id={uid + 'cl'}><path d={SIDE} /></clipPath>
      </defs>

      {/* เงาบนผิวน้ำ */}
      <ellipse cx="100" cy="146" rx="88" ry="14" fill={u('ws')} />

      {/* ใบตองพับชั้นหลัง */}
      {layout.back.map((l, i) => <Leaf key={`b${i}`} {...l} fillL={u('pl')} fillR={u('pr')} edge={p.edge} />)}

      {/* ฐานกระทง */}
      <path d={SIDE} fill={u('sd')} />
      <g clipPath={u('cl')}>
        {base === 'banana' && Array.from({ length: 22 }, (_, i) => 32 + i * 6.3).map((x, i) => (
          <path key={`f${x}`} d={`M${x} 112 Q${x + 1.5} 130 ${x - .5} 152`} stroke={i % 2 ? '#FFFFFF' : b.line} strokeOpacity={i % 2 ? .22 : .45} strokeWidth={i % 2 ? .7 : 1} fill="none" />
        ))}
        {base === 'bread' && Array.from({ length: 40 }, (_, i) => [34 + ((i * 37) % 128), 118 + ((i * 53) % 30)]).map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={1 + (i % 3) * .5} ry=".8" fill={i % 4 ? mix(b.body, '#000000', .35) : mix(b.top, '#FFFFFF', .3)} opacity=".6" />
        ))}
        {base === 'coconut' && Array.from({ length: 16 }, (_, i) => 118 + i * 2.2).map((y, i) => (
          <path key={y} d={`M26 ${y} Q100 ${y + 15} 174 ${y}`} stroke={i % 3 ? mix(b.line, '#000000', .2) : mix(b.top, '#FFFFFF', .2)} strokeOpacity=".45" strokeWidth=".6" fill="none" />
        ))}
        <rect x="20" y="104" width="160" height="56" fill={u('sdh')} />
        <rect x="20" y="130" width="160" height="30" fill={u('wl')} />
      </g>
      <ellipse cx="100" cy="116" rx="72" ry="13" fill={u('tp')} />
      <ellipse cx="100" cy="116" rx="72" ry="13" fill="none" stroke={mix(b.line, '#000000', .2)} strokeOpacity=".6" strokeWidth=".8" />
      <ellipse cx="100" cy="117.5" rx="66" ry="10" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="2" />

      {/* ใบตองพับชั้นหน้า */}
      {layout.front.map((l, i) => <Leaf key={`f${i}`} {...l} fillL={u('pl')} fillR={u('pr')} edge={p.edge} />)}

      {children}
    </svg>
  );
}

export default function Krathong(k) {
  const { pixel } = useStyleMode();
  if (!pixel) return <KrathongArt {...k} />;
  const key = JSON.stringify([k.base, k.petal, k.fold, itemsOf(k)]);
  return (
    <Pixelated cacheKey={key} res={48} width={k.size || 120} ratio={0.85}>
      <KrathongArt {...k} />
    </Pixelated>
  );
}

function KrathongArt(k) {
  const art = useArtId();
  const [, u] = art;
  const items = itemsOf(k);
  return (
    <KrathongSvg base={k.base} petal={k.petal} fold={k.fold} size={k.size || 120} art={art}>
      {items.map((it, i) => PARTS[it.type] && (
        <g key={i} transform={partTransform(it)}>
          <PartShadow type={it.type} u={u} />
          {PARTS[it.type].draw(u)}
        </g>
      ))}
    </KrathongSvg>
  );
}

/** ไอคอนเล็กแสดงลายใบตองพับสำหรับปุ่มเลือก */
export function FoldIcon({ fold, petal = 'leaf' }) {
  const p = PETALS[petal] || PETALS.leaf;
  const shade = (c, t) => mixHex(c, '#000000', t);
  const L = FOLD_LAYOUTS[fold] || FOLD_LAYOUTS.phanom;
  const pick = L.back.filter(l => l.x >= 70 && l.x <= 130);
  return (
    <svg viewBox="62 46 76 76" width="44" height="44" aria-hidden="true" focusable="false">
      {pick.map((l, i) => <Leaf key={i} {...l} fillL={shade(p.edge, .2)} fillR={p.color} edge={p.edge} />)}
      <rect x="62" y="116" width="76" height="6" fill={shade(p.edge, .35)} />
    </svg>
  );
}
