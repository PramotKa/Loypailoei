import { useCallback, useEffect, useRef, useState } from 'react';
import { KrathongSvg, inZone, ZONE, FoldIcon } from './Krathong.jsx';
import { BASES, PETALS, FOLDS } from '../options.js';
import { rasterize, useStyleMode } from '../pixel.jsx';
import { CATEGORIES, PARTS, PART_TYPES, PartThumb, PartShadow, partTransform, useArtId } from '../parts.jsx';

const MAX_ITEMS = 30;
const WISH_MAX = 140;
const DRAG_START = 6;
let seq = 0;
const newId = () => `p${Date.now().toString(36)}${seq++}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function randomSpot() {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * 0.75;
  return { x: ZONE.cx + Math.cos(a) * ZONE.rx * r, y: ZONE.cy + Math.sin(a) * ZONE.ry * r };
}

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const ICONS = {
  close: 'M6 6l12 12M18 6L6 18',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  smaller: 'M5 12h14',
  bigger: 'M12 5v14M5 12h14',
  rotL: 'M3 4v6h6M3.5 10A9 9 0 1 1 6 18',
  rotR: 'M21 4v6h-6M20.5 10A9 9 0 1 0 18 18',
  front: 'M4 15l8 5 8-5M4 10l8 5 8-5 -8-5z',
  clear: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  pixel: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'
};

export default function Workshop({ open, onClose, onFloat }) {
  const [base, setBase] = useState('banana');
  const [petal, setPetal] = useState('leaf');
  const [fold, setFold] = useState('phanom');
  const [items, setItems] = useState([]);
  const [past, setPast] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('flower');
  const [step, setStep] = useState('decorate');
  const [ghost, setGhost] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const art = useArtId();
  const u = art[1];
  const { pixel, toggle: toggleStyle } = useStyleMode();
  const [snap, setSnap] = useState(null);
  const svgRef = useRef(null);
  const headingRef = useRef(null);
  const wishRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const noticeTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    headingRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !drag.current && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // โหมด 8-bit: วาดกระทงบนเวทีเป็นภาพพิกเซลใหม่ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    if (!pixel || !open) return;
    let alive = true;
    const id = requestAnimationFrame(() => {
      if (svgRef.current) rasterize(svgRef.current, 64).then(u => alive && setSnap(u)).catch(() => {});
    });
    return () => { alive = false; cancelAnimationFrame(id); };
  }, [pixel, open, items, base, petal, fold]);

  const say = useCallback((text, undo = false) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, undo });
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  const commit = (prev) => setPast(p => [...p.slice(-40), prev]);
  const change = (next) => { commit(itemsRef.current); setItems(next); };

  function undo() {
    if (!past.length) return;
    setItems(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
    setSelected(null);
    setNotice(null);
  }

  function toSvg(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function overStage(clientX, clientY) {
    const r = svgRef.current?.getBoundingClientRect();
    return r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function addPart(type, pos = randomSpot()) {
    if (itemsRef.current.length >= MAX_ITEMS) { say(`กระทงเต็มแล้ว ใส่ได้สูงสุด ${MAX_ITEMS} ชิ้น`); return; }
    const it = { id: newId(), type, x: +pos.x.toFixed(1), y: +pos.y.toFixed(1), s: 1, r: 0 };
    change([...itemsRef.current, it]);
    setSelected(it.id);
  }

  // ---------- การลาก (pointer events: ใช้ได้ทั้งเมาส์และนิ้ว) ----------
  function onMove(e) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_START) return;
    if (!d.moved) { d.moved = true; setDragging(true); }
    const p = toSvg(e.clientX, e.clientY);
    if (d.mode === 'new') {
      const ok = overStage(e.clientX, e.clientY) && p && inZone(p.x, p.y);
      setGhost({ type: d.type, x: e.clientX, y: e.clientY, ok });
    } else if (p) {
      const x = clamp(p.x - d.ox, -10, 210), y = clamp(p.y - d.oy, -10, 180);
      d.out = !inZone(x, y);
      setItems(list => list.map(it => it.id === d.id ? { ...it, x: +x.toFixed(1), y: +y.toFixed(1), out: d.out } : it));
    }
  }

  function onUp(e) {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    setDragging(false);
    setGhost(null);
    if (!d || !d.moved) return;
    if (d.mode === 'new') {
      suppressClick.current = true;
      const p = toSvg(e.clientX, e.clientY);
      if (e.type !== 'pointercancel' && overStage(e.clientX, e.clientY) && p && inZone(p.x, p.y)) addPart(d.type, p);
      else say('วางวัสดุบนตัวกระทงนะ');
    } else {
      setPast(pp => [...pp.slice(-40), d.snapshot]);
      if (d.out) {
        setItems(list => list.filter(it => it.id !== d.id));
        setSelected(null);
        say(`${PARTS[d.type].label}หล่นลงน้ำ`, true);
      } else {
        setItems(list => list.map(it => it.id === d.id ? { ...it, out: undefined } : it));
      }
    }
  }

  function startDrag(state, e) {
    if (e.button !== undefined && e.button !== 0) return;
    drag.current = { ...state, sx: e.clientX, sy: e.clientY, moved: false };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function onTrayDown(e, type) {
    startDrag({ mode: 'new', type }, e);
  }
  function onTrayClick(type) {
    if (suppressClick.current) { suppressClick.current = false; return; }
    addPart(type);
  }

  function onItemDown(e, it) {
    e.stopPropagation();
    e.preventDefault();
    setSelected(it.id);
    const p = toSvg(e.clientX, e.clientY);
    startDrag({ mode: 'move', id: it.id, type: it.type, ox: p.x - it.x, oy: p.y - it.y, snapshot: itemsRef.current }, e);
  }

  // ---------- แก้ไขชิ้นที่เลือก ----------
  const sel = items.find(it => it.id === selected);
  function edit(fn) {
    if (!sel) return;
    change(itemsRef.current.map(it => it.id === sel.id ? fn(it) : it));
  }
  const scaleBy = (k) => edit(it => ({ ...it, s: +clamp(it.s * k, 0.5, 2).toFixed(2) }));
  const rotateBy = (a) => edit(it => ({ ...it, r: ((it.r + a + 540) % 360) - 180 }));
  const toFront = () => { if (sel) change([...itemsRef.current.filter(it => it.id !== sel.id), sel]); };
  const remove = () => { if (sel) { change(itemsRef.current.filter(it => it.id !== sel.id)); setSelected(null); } };

  function onItemKey(e, it) {
    const step = e.shiftKey ? 8 : 3;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      const x = it.x + dx, y = it.y + dy;
      if (inZone(x, y)) change(itemsRef.current.map(o => o.id === it.id ? { ...o, x, y } : o));
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(); }
    else if (e.key === '+' || e.key === '=') scaleBy(1.15);
    else if (e.key === '-') scaleBy(1 / 1.15);
    else if (e.key === '[') rotateBy(-15);
    else if (e.key === ']') rotateBy(15);
  }

  function surprise() {
    const pool = ['marigold', 'jasmine', 'rose', 'orchid', 'globe', 'crown'];
    const flower = pool[Math.floor(Math.random() * pool.length)];
    const accent = pool[Math.floor(Math.random() * pool.length)];
    const next = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      next.push({ id: newId(), type: i % 3 === 0 ? accent : flower, x: +(100 + Math.cos(a) * 52).toFixed(1), y: +(112 + Math.sin(a) * 15).toFixed(1), s: 1, r: 0 });
    }
    next.sort((a, b) => a.y - b.y);
    next.splice(3, 0, { id: newId(), type: 'lotus', x: 100, y: 108, s: 1.1, r: 0 });
    next.push({ id: newId(), type: 'incense', x: 88, y: 112, s: 0.9, r: -6 }, { id: newId(), type: 'candle', x: 110, y: 114, s: 1, r: 0 });
    change(next);
    setSelected(null);
  }

  function clearAll() {
    if (!items.length) return;
    change([]);
    setSelected(null);
    say('ล้างกระทงแล้ว', true);
  }

  async function submit(e) {
    e.preventDefault();
    if (!wish.trim()) { setError('เขียนคำอธิษฐานอย่างน้อยหนึ่งประโยคก่อนลอยกระทง'); wishRef.current?.focus(); return; }
    setSaving(true); setError('');
    try {
      await onFloat({
        base, petal, fold, name, wish,
        items: items.map(({ type, x, y, s, r }) => ({ type, x, y, s, r })),
        candle: items.some(i => i.type === 'candle'),
        incense: items.some(i => i.type === 'incense')
      });
      setItems([]); setPast([]); setWish(''); setStep('decorate'); setSelected(null);
    } catch (err) {
      setError(err.message || 'ลอยกระทงไม่สำเร็จ ลองอีกครั้ง');
    } finally { setSaving(false); }
  }

  const tray = PART_TYPES.filter(t => PARTS[t].cat === tab);

  return (
    <div className={`workshop${open ? ' is-open' : ''}${dragging ? ' is-dragging' : ''}`} role="dialog" aria-modal="true"
      aria-labelledby="ws-title" inert={open ? undefined : ''}>
      <header className="ws-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิดหน้าประดิษฐ์กระทง"><Icon d={ICONS.close} /></button>
        <h2 id="ws-title" tabIndex={-1} ref={headingRef}>ประดิษฐ์กระทง</h2>
        <div className="ws-bar__tools">
          <button type="button" className="tool" aria-label="เลิกทำ" onClick={undo} disabled={!past.length}><Icon d={ICONS.undo} /><span aria-hidden="true">เลิกทำ</span></button>
          <button type="button" className="tool" aria-label="จัดให้" onClick={surprise}><Icon d={ICONS.shuffle} /><span aria-hidden="true">จัดให้</span></button>
          <button type="button" className="tool" aria-label={pixel ? 'โหมดสมจริง' : 'โหมด 8-bit'} aria-pressed={pixel} onClick={toggleStyle}><Icon d={ICONS.pixel} /><span aria-hidden="true">8-bit</span></button>
          <button type="button" className="tool" aria-label="ล้าง" onClick={clearAll} disabled={!items.length}><Icon d={ICONS.clear} /><span aria-hidden="true">ล้าง</span></button>
        </div>
      </header>

      <section className="ws-stage" onPointerDown={() => setSelected(null)}>
        <div className="ws-stage__inner">
          {pixel && snap && <img className="ws-pixel" src={snap} alt="" draggable="false" />}
          <KrathongSvg base={base} petal={petal} fold={fold} svgRef={svgRef} className="ws-svg" interactive art={art}>
            <ellipse className="zone" cx={ZONE.cx} cy={ZONE.cy} rx={ZONE.rx} ry={ZONE.ry} />
            {items.map(it => {
              const label = PARTS[it.type].label;
              return (
                <g key={it.id} transform={partTransform(it)} tabIndex={0} role="button"
                  aria-label={`${label} บนกระทง${it.id === selected ? ' (เลือกอยู่)' : ''}`}
                  aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Delete"
                  className={`part${it.id === selected ? ' is-selected' : ''}${it.out ? ' is-out' : ''}`}
                  onPointerDown={e => onItemDown(e, it)} onFocus={() => setSelected(it.id)} onKeyDown={e => onItemKey(e, it)}>
                  {it.id === selected && (
                    <ellipse className="part__ring" cx="0" cy={-PARTS[it.type].h / 2} rx={Math.max(14, PARTS[it.type].h / 2 + 4)} ry={PARTS[it.type].h / 2 + 5} vectorEffect="non-scaling-stroke" />
                  )}
                  <PartShadow type={it.type} u={u} />
                  {PARTS[it.type].draw(u)}
                </g>
              );
            })}
          </KrathongSvg>
        </div>

        {!items.length && step === 'decorate' && (
          <p className="ws-hint">ลากดอกไม้ เทียน หรือธูปมาวางบนกระทง<br />หรือแตะวัสดุเพื่อวางทันที</p>
        )}

        {sel && step === 'decorate' && (
          <div className="ws-edit" role="toolbar" aria-label={`แก้ไข${PARTS[sel.type].label}`} onPointerDown={e => e.stopPropagation()}>
            <button type="button" aria-label="ย่อ" className="tool" onClick={() => scaleBy(1 / 1.15)} disabled={sel.s <= 0.5}><Icon d={ICONS.smaller} /><span aria-hidden="true">ย่อ</span></button>
            <button type="button" aria-label="ขยาย" className="tool" onClick={() => scaleBy(1.15)} disabled={sel.s >= 2}><Icon d={ICONS.bigger} /><span aria-hidden="true">ขยาย</span></button>
            <button type="button" aria-label="หมุนซ้าย" className="tool" onClick={() => rotateBy(-15)}><Icon d={ICONS.rotL} /><span aria-hidden="true">หมุนซ้าย</span></button>
            <button type="button" aria-label="หมุนขวา" className="tool" onClick={() => rotateBy(15)}><Icon d={ICONS.rotR} /><span aria-hidden="true">หมุนขวา</span></button>
            <button type="button" className="tool" aria-label="ไว้หน้าสุด" onClick={toFront}><Icon d={ICONS.front} /><span aria-hidden="true">ไว้หน้าสุด</span></button>
            <button type="button" className="tool tool--danger" aria-label="เอาออก" onClick={remove}><Icon d={ICONS.trash} /><span aria-hidden="true">เอาออก</span></button>
          </div>
        )}

        <div className="ws-notice" role="status" aria-live="polite">
          {notice && (
            <span className="ws-notice__pill">
              {notice.text}
              {notice.undo && past.length > 0 && <button type="button" onClick={undo}>เลิกทำ</button>}
            </span>
          )}
        </div>
      </section>

      <section className="ws-panel">
        {step === 'decorate' ? (
          <>
            <div className="ws-tabs" role="tablist" aria-label="หมวดวัสดุ">
              {CATEGORIES.map(c => (
                <button key={c.id} type="button" role="tab" id={`tab-${c.id}`} aria-selected={tab === c.id} aria-controls="ws-tray"
                  className="ws-tab" onClick={() => setTab(c.id)}>{c.label}</button>
              ))}
            </div>

            <div id="ws-tray" role="tabpanel" aria-labelledby={`tab-${tab}`} className="ws-tray">
              {tab === 'base' ? (
                <div className="ws-basepick">
                  <fieldset className="field">
                    <legend>ฐาน</legend>
                    <div className="choices choices--cards">
                      {Object.entries(BASES).map(([key, o]) => (
                        <label key={key} className="choice">
                          <input type="radio" name="base" checked={base === key} onChange={() => setBase(key)} />
                          <span className="choice__box">
                            <span className="choice__dot choice__dot--base" style={{ background: o.body, borderColor: o.line }} />
                            <span className="choice__text">{o.label}<small>{o.note}</small></span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="field">
                    <legend>สีใบตอง</legend>
                    <div className="choices choices--dots">
                      {Object.entries(PETALS).map(([key, o]) => (
                        <label key={key} className="choice">
                          <input type="radio" name="petal" checked={petal === key} onChange={() => setPetal(key)} />
                          <span className="choice__box">
                            <span className="choice__dot" style={{ background: o.color, borderColor: o.edge }} />
                            <span className="choice__text">{o.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="field">
                    <legend>ลายใบตองพับ</legend>
                    <div className="choices choices--folds">
                      {Object.entries(FOLDS).map(([key, o]) => (
                        <label key={key} className="choice">
                          <input type="radio" name="fold" checked={fold === key} onChange={() => setFold(key)} />
                          <span className="choice__box choice__box--fold">
                            <FoldIcon fold={key} petal={petal} />
                            <span className="choice__text">{o.label}<small>{o.note}</small></span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : (
                <ul className="parts">
                  {tray.map(type => (
                    <li key={type}>
                      <button type="button" className="part-card" onPointerDown={e => onTrayDown(e, type)} onClick={() => onTrayClick(type)}
                        aria-label={`วาง${PARTS[type].label}บนกระทง`}>
                        <PartThumb type={type} size={52} />
                        <span>{PARTS[type].label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ws-next">
              <span className="ws-count">{items.length}/{MAX_ITEMS} ชิ้น</span>
              <button type="button" className="btn btn--primary" onClick={() => { setSelected(null); setStep('wish'); }}>
                ต่อไป: เขียนคำอธิษฐาน
              </button>
            </div>
          </>
        ) : (
          <form className="ws-wish" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="ws-name">ชื่อที่จะแสดง</label>
              <input id="ws-name" type="text" maxLength={30} autoComplete="nickname" placeholder="เว้นว่างได้" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ws-wish-input">คำอธิษฐาน</label>
              <textarea id="ws-wish-input" ref={wishRef} rows={3} maxLength={WISH_MAX} value={wish} autoFocus
                aria-invalid={Boolean(error) || undefined} aria-describedby="ws-wish-help ws-wish-error"
                onChange={e => { setWish(e.target.value); if (error) setError(''); }} />
              <div className="field__meta">
                <span id="ws-wish-help">ทุกคนที่แตะกระทงของคุณจะอ่านคำอธิษฐานนี้ได้</span>
                <span>{wish.length}/{WISH_MAX}</span>
              </div>
              <p id="ws-wish-error" className="field__error" role="alert">{error}</p>
            </div>
            <div className="ws-next">
              <button type="button" className="btn btn--plain" onClick={() => setStep('decorate')}>กลับไปตกแต่ง</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'กำลังลอยกระทง…' : 'ลอยกระทง'}</button>
            </div>
          </form>
        )}
      </section>

      {ghost && (
        <div className={`ghost${ghost.ok ? ' is-ok' : ''}`} style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <PartThumb type={ghost.type} size={64} />
        </div>
      )}
    </div>
  );
}
