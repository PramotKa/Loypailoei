import Krathong, { itemsOf } from './Krathong.jsx';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  // finalizer ให้ค่ากระจายตัว แม้ id ต่างกันแค่ตัวอักษรเดียว
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export default function River({ items, paused, mineId, onSelect }) {
  return (
    <div className={`river${paused ? ' is-paused' : ''}`}>
      <ul className="river__lane" aria-label="กระทงที่กำลังลอยอยู่">
        {items.slice(0, 60).map(k => {
          const r1 = hash(k.id), r2 = hash(k.id + 'd'), r3 = hash(k.id + 'x');
          const lane = r1;
          const dur = 55 + r2 * 50;
          const mine = k.id === mineId;
          const style = {
            '--top': `${4 + lane * 66}%`,
            '--scale': (0.55 + lane * 0.6).toFixed(2),
            '--dur': `${dur.toFixed(1)}s`,
            '--delay': mine ? `-${(dur * 0.24).toFixed(1)}s` : `-${(r3 * dur).toFixed(1)}s`,
            '--x': `${(r3 * 90).toFixed(1)}vw`,
            '--bob': `${(3 + r2 * 2).toFixed(1)}s`,
            '--bright': (0.68 + lane * 0.34).toFixed(2),
            zIndex: Math.round(lane * 100)
          };
          return (
            <li key={k.id} className="drift" style={style}>
              <button type="button" className={`k${mine ? ' k--mine' : ''}`} onClick={() => onSelect(k)}
                aria-label={`กระทงของ ${k.name} แตะเพื่ออ่านคำอธิษฐาน`}>
                {mine && <span className="k__tag">กระทงของคุณ</span>}
                <span className="k__water" aria-hidden="true">
                  <span className="k__ripple" />
                  <span className="k__ripple k__ripple--late" />
                  {itemsOf(k).some(i => i.type === 'candle') && <span className="k__reflect" />}
                </span>
                <span className="bob"><Krathong {...k} size={120} /></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
