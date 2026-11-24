import { useCallback, useEffect, useRef, useState } from 'react';
import River from './components/River.jsx';
import Workshop from './components/Workshop.jsx';
import WishDialog from './components/WishDialog.jsx';
import MyKrathongs from './components/MyKrathongs.jsx';
import Sky from './components/Sky.jsx';
import LanternMaker from './components/LanternMaker.jsx';
import { listKrathongs, listLanterns, createKrathong, deleteKrathong, isMine, mineCount, getAdminKey, setAdminKey } from './api.js';
import { StyleContext, useStyleState } from './pixel.jsx';

export default function App() {
  const [items, setItems] = useState([]);
  const [lanterns, setLanterns] = useState([]);
  const [makerOpen, setMakerOpen] = useState(false);
  const [mineLanternId, setMineLanternId] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState('');
  const [mineId, setMineId] = useState(null);
  const styleState = useStyleState();
  const [admin, setAdmin] = useState(() => Boolean(getAdminKey()));
  const [mineOpen, setMineOpen] = useState(false);
  const [mine, setMine] = useState(() => mineCount());
  // กระทงที่เพิ่งลบ: กรองออกจากผลที่ดึงซ้ำ เผื่อ CDN ยังส่งรายการเก่ามาไม่กี่วินาที
  const deleted = useRef(new Set());

  const say = useCallback((text, ms = 3500) => {
    setToast(text);
    setTimeout(() => setToast(''), ms);
  }, []);

  // โหมดผู้ดูแล: เปิดเว็บด้วย #admin แล้วใส่รหัส ADMIN_TOKEN
  useEffect(() => {
    const check = () => {
      if (location.hash !== '#admin') return;
      const key = window.prompt('ใส่รหัสผู้ดูแล (ADMIN_TOKEN) เพื่อลบกระทงที่ไม่เหมาะสม');
      if (key) { setAdminKey(key.trim()); setAdmin(true); }
      history.replaceState(null, '', location.pathname + location.search);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  useEffect(() => {
    let alive = true;
    const keep = (d) => d.filter(k => !deleted.current.has(k.id));
    const load = () => {
      listKrathongs().then(d => alive && setItems(keep(d))).catch(() => { });
      listLanterns().then(d => alive && setLanterns(keep(d))).catch(() => { });
    };
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const closeBuilder = useCallback(() => setBuilderOpen(false), []);

  async function handleFloat(data) {
    const k = await createKrathong(data);
    setItems(prev => [k, ...prev.filter(p => p.id !== k.id)]);
    setMineId(k.id);
    setMine(mineCount());
    setBuilderOpen(false);
    say('ลอยกระทงแล้ว ขอให้คำอธิษฐานของคุณเป็นจริง', 4500);
  }

  async function handleRelease(data) {
    const k = await createKrathong(data);
    setLanterns(prev => [k, ...prev.filter(p => p.id !== k.id)]);
    setMineLanternId(k.id);
    setMine(mineCount());
    setMakerOpen(false);
    say('ปล่อยโคมแล้ว ขอให้คำอธิษฐานลอยขึ้นไปถึงฟ้า', 4500);
  }

  async function handleDelete(k) {
    await deleteKrathong(k.id);
    deleted.current.add(k.id);
    setItems(prev => prev.filter(p => p.id !== k.id));
    setLanterns(prev => prev.filter(p => p.id !== k.id));
    if (mineId === k.id) setMineId(null);
    setMine(mineCount());
    setSelected(null);
    setToast('ลบกระทงแล้ว');
    say(k.kind === 'lantern' ? 'ลบโคมแล้ว' : 'ลบกระทงแล้ว', 3000);
  }
}

const closeMine = useCallback(() => { setMineOpen(false); setMine(mineCount()); }, []);

function exitAdmin() {
  setAdminKey('');
  setAdmin(false);
}

return (
  <StyleContext.Provider value={styleState}>
    <div className="app">
      <div className="scene">
        <div className="scene__bg" aria-hidden="true" />
        <Sky lanterns={lanterns} paused={paused} mineId={mineLanternId} onSelect={setSelected} />
        <River items={items} paused={paused} mineId={mineId} onSelect={setSelected} />
      </div>

      <main className="hero">
        <h1>ลอยไปเลย<span>ลอยกระทงออนไลน์ คืนวันเพ็ญ</span></h1>
        <p>แต่งกระทงในแบบของคุณ หรือปล่อยโคมลอยขึ้นฟ้า พร้อมคำอธิษฐาน ไปกับทุกคนในค่ำคืนนี้</p>
        <div className="hero__actions">
          <button type="button" className="btn btn--ghost btn--lantern" onClick={() => setMakerOpen(true)}>ปล่อยโคมลอย</button>
          +          <span className="hero__hint">แตะกระทงหรือโคมเพื่ออ่านคำอธิษฐาน</span>
        </div>
      </main>

      <footer className="dock">
        <span className="dock__count"><strong>{items.length}</strong> กระทง · <strong>{lanterns.length}</strong> โคม</span>
        <span className="dock__actions">
          {mine > 0 && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setMineOpen(true)}>ของฉัน ({mine})</button>
          )}
          {admin && (
            <button type="button" className="btn btn--ghost btn--small btn--admin" onClick={exitAdmin}>ออกจากโหมดผู้ดูแล</button>
          )}
          <button type="button" className="btn btn--ghost btn--small" aria-pressed={styleState.pixel} onClick={styleState.toggle}>
            {styleState.pixel ? 'โหมดสมจริง' : 'โหมด 8-bit'}
          </button>
          <button type="button" className="btn btn--ghost btn--small" aria-pressed={paused} onClick={() => setPaused(p => !p)}>
            {paused ? 'ให้สายน้ำไหลต่อ' : 'หยุดสายน้ำ'}
          </button>
        </span>
      </footer>

      <Workshop open={builderOpen} onClose={closeBuilder} onFloat={handleFloat} />
      <WishDialog krathong={selected} onClose={() => setSelected(null)} onDelete={handleDelete}
        owned={Boolean(selected && isMine(selected.id))} canDelete={Boolean(selected && (admin || isMine(selected.id)))} />
      <LanternMaker open={makerOpen} onClose={() => setMakerOpen(false)} onRelease={handleRelease} />
      <MyKrathongs open={mineOpen} onClose={closeMine} onDelete={handleDelete} />
      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  </StyleContext.Provider>
);

