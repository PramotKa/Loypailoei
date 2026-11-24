import { useEffect, useRef, useState } from 'react';
import Krathong from './Krathong.jsx';
import Lantern from './Lantern.jsx';
import { listMine } from '../api.js';

const fmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

/** รายการ "กระทงของฉัน": ดูและลบกระทงที่ลอยจากเครื่องนี้ได้ แม้ลอยพ้นจอไปแล้ว */
export default function MyKrathongs({ open, onClose, onDelete }) {
  const ref = useRef(null);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) return;
    let alive = true;
    setList(null); setError(''); setConfirmId(null);
    listMine().then(l => alive && setList(l)).catch(err => alive && (setError(err.message || 'โหลดไม่สำเร็จ'), setList([])));
    return () => { alive = false; };
  }, [open]);

  async function remove(k) {
    setBusyId(k.id); setError('');
    try {
      await onDelete(k);
      setList(l => l.filter(x => x.id !== k.id));
      setConfirmId(null);
    } catch (err) {
      setError(err.message || 'ลบไม่สำเร็จ ลองอีกครั้ง');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <dialog ref={ref} className="wish mine" onClose={onClose} onClick={e => e.target === ref.current && !busyId && onClose()} aria-labelledby="mine-title">
      <div className="mine__inner">
        <header className="mine__head">
          <h2 id="mine-title">กระทงและโคมของฉัน</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>
        <p className="mine__note">กระทงและโคมที่ปล่อยจากเครื่องนี้ ลบได้แม้ลอยพ้นจอไปแล้ว</p>

        {list === null && <p className="mine__empty">กำลังโหลด…</p>}
        {list && list.length === 0 && !error && <p className="mine__empty">ยังไม่มีกระทงหรือโคมที่ปล่อยจากเครื่องนี้</p>}


        {list && list.length > 0 && (
          <ul className="mine__list">
            {list.map(k => (
              <li key={k.id} className="mine__item">
                <div className="mine__art">{k.kind === 'lantern' ? <Lantern color={k.color} size={40} /> : <Krathong {...k} size={72} />}</div>
                <div className="mine__body">
                  <p className="mine__wish">{k.wish}</p>
                  <p className="mine__meta">{k.name} · <time dateTime={k.createdAt}>{fmt.format(new Date(k.createdAt))}</time></p>
                  {confirmId === k.id ? (
                    <div className="mine__confirm" role="group" aria-label="ยืนยันการลบ">
                      <span>ลบถาวร กู้คืนไม่ได้</span>
                      <button type="button" className="btn btn--ghost btn--tiny" onClick={() => setConfirmId(null)} disabled={busyId === k.id} autoFocus>ยกเลิก</button>
                      <button type="button" className="btn btn--danger btn--tiny" onClick={() => remove(k)} disabled={busyId === k.id}>
                        {busyId === k.id ? 'กำลังลบ…' : 'ลบถาวร'}
                      </button>
                    </div>
                  ) : (
                    <div className="mine__row-actions">
                      <button type="button" className="btn btn--danger btn--tiny" onClick={() => setConfirmId(k.id)}
                        aria-label={`ลบ${k.kind === 'lantern' ? 'โคม' : 'กระทง'}: ${k.wish}`}>ลบ</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="wish__error" role="alert">{error}</p>
      </div>
    </dialog>
  );
}
