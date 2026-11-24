import { useEffect, useRef, useState } from 'react';
import Lantern, { LANTERN_COLORS } from './Lantern.jsx';

const WISH_MAX = 140;

/** หน้าต่างปล่อยโคมลอย: เลือกสี เขียนชื่อ และคำอธิษฐาน */
export default function LanternMaker({ open, onClose, onRelease }) {
  const ref = useRef(null);
  const wishRef = useRef(null);
  const [color, setColor] = useState('orange');
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setError(''); }
    if (!open && d.open) d.close();
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!wish.trim()) { setError('เขียนคำอธิษฐานก่อนปล่อยโคม'); wishRef.current?.focus(); return; }
    setSaving(true); setError('');
    try {
      await onRelease({ kind: 'lantern', color, name, wish });
      setWish('');
    } catch (err) {
      setError(err.message || 'ปล่อยโคมไม่สำเร็จ ลองอีกครั้ง');
    } finally { setSaving(false); }
  }

  return (
    <dialog ref={ref} className="wish maker" onClose={onClose} aria-labelledby="maker-title">
      <form className="maker__inner" onSubmit={submit} noValidate>
        <header className="mine__head">
          <h2 id="maker-title">ปล่อยโคมลอย</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>

        <div className="maker__preview" aria-hidden="true">
          <span className="sway"><Lantern color={color} size={110} /></span>
        </div>

        <fieldset className="field">
          <legend>สีโคม</legend>
          <div className="choices choices--dots">
            {Object.entries(LANTERN_COLORS).map(([key, c]) => (
              <label key={key} className="choice">
                <input type="radio" name="lantern-color" checked={color === key} onChange={() => setColor(key)} />
                <span className="choice__box">
                  <span className="choice__dot" style={{ background: c.swatch, borderColor: '#00000033' }} />
                  <span className="choice__text">{c.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="lantern-name">ชื่อที่จะแสดง</label>
          <input id="lantern-name" type="text" maxLength={30} autoComplete="nickname" placeholder="เว้นว่างได้" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lantern-wish">คำอธิษฐาน</label>
          <textarea id="lantern-wish" ref={wishRef} rows={3} maxLength={WISH_MAX} value={wish}
            aria-invalid={Boolean(error) || undefined} aria-describedby="lantern-wish-meta lantern-error"
            onChange={e => { setWish(e.target.value); if (error) setError(''); }} />
          <div className="field__meta" id="lantern-wish-meta">
            <span>ทุกคนที่แตะโคมของคุณจะอ่านคำอธิษฐานนี้ได้</span>
            <span>{wish.length}/{WISH_MAX}</span>
          </div>
          <p id="lantern-error" className="field__error" role="alert">{error}</p>
        </div>

        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'กำลังปล่อยโคม…' : 'ปล่อยโคม'}
        </button>
      </form>
    </dialog>
  );
}