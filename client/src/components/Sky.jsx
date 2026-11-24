import Lantern from './Lantern.jsx';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** ท้องฟ้า: โคมลอยค่อย ๆ ลอยขึ้นจากริมน้ำ แกว่งเบา ๆ แล้วเล็กลงจนหายไปบนฟ้า */
export default function Sky({ lanterns, paused, mineId, onSelect }) {
  return (
    <div className={`sky${paused ? ' is-paused' : ''}`}>
      <ul className="sky__list" aria-label="โคมลอยบนท้องฟ้า">
        {lanterns.slice(0, 40).map(k => {
          const r1 = hash(k.id), r2 = hash(k.id + 's'), r3 = hash(k.id + 't');
          const dur = 70 + r2 * 60;
          const mine = k.id === mineId;
          const style = {
            '--left': `${4 + r1 * 88}%`,
            '--dur': `${dur.toFixed(1)}s`,
            '--delay': mine ? `-${(dur * 0.01).toFixed(1)}s` : `-${(r3 * dur).toFixed(1)}s`,
            '--depth': (0.7 + r2 * 0.45).toFixed(2),
            '--sway': `${(5 + r3 * 4).toFixed(1)}s`,
            '--y': `${(r3 * 60).toFixed(1)}vh`,
            zIndex: Math.round(r2 * 10)
          };
          return (
            <li key={k.id} className="rise" style={style}>
              <button type="button" className={`lan${mine ? ' lan--mine' : ''}`} onClick={() => onSelect(k)}
                aria-label={`โคมลอยของ ${k.name} แตะเพื่ออ่านคำอธิษฐาน`}>
                {mine && <span className="k__tag">โคมของคุณ</span>}
                <span className="sway"><Lantern color={k.color} size={74} flip={r1 > 0.5} /></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}