import { useEffect, useRef, useState } from 'react';
import Krathong from './Krathong.jsx';
import Lantern from './Lantern.jsx';

const fmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export default function WishDialog({ krathong, onClose, canDelete = false, owned = false, onDelete }) {
  const ref = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (krathong && !d.open) d.showModal();
    if (!krathong && d.open) d.close();
    setConfirming(false); setBusy(false); setError('');
  }, [krathong]);

  async function remove() {
    setBusy(true); setError('');
    try { await onDelete(krathong); }
    catch (err) { setError(err.message || 'ลบไม่สำเร็จ ลองอีกครั้ง'); setBusy(false); }
  }

  return (
    <dialog ref={ref} className="wish" onClose={onClose} onClick={e => e.target === ref.current && !busy && onClose()} aria-labelledby="wish-name">
      {krathong && (
        <div className="wish__inner">
          {owned && <p className="wish__mine">{krathong.kind === 'lantern' ? 'โคมของคุณ' : 'กระทงของคุณ'}</p>}
          {krathong.kind === 'lantern'
            ? <div className="wish__art wish__art--lantern sway"><Lantern color={krathong.color} size={96} /></div>
            : <div className="wish__art bob"><Krathong {...krathong} size={150} /></div>}
          <p className="wish__text">{krathong.wish}</p>
          <p className="wish__by"><span id="wish-name">{krathong.name}</span><br /><time dateTime={krathong.createdAt}>{fmt.format(new Date(krathong.createdAt))}</time></p>

          {!confirming ? (
            <div className="wish__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose} autoFocus>ปล่อยให้ลอยต่อไป</button>
              {canDelete && (
                <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>{krathong.kind === 'lantern' ? 'ลบโคมนี้' : 'ลบกระทงนี้'}</button>
              )}
            </div>
          ) : (
            <div className="wish__confirm" role="group" aria-labelledby="wish-confirm-text">
              <p id="wish-confirm-text">{krathong.kind === 'lantern' ? 'ลบโคมนี้ออกจากท้องฟ้าถาวร' : 'ลบกระทงนี้ออกจากสายน้ำถาวร'} ทุกคนจะไม่เห็นอีก และกู้คืนไม่ได้</p>
              <div className="wish__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={busy} autoFocus>ยกเลิก</button>
                <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>{busy ? 'กำลังลบ…' : 'ลบถาวร'}</button>
              </div>
            </div>
          )}
          <p className="wish__error" role="alert">{error}</p>
        </div>
      )}
    </dialog>
  );
}
