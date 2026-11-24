import lanternSrc from '../lantern.webp';
import lanternPixelSrc from '../lantern-pixel.png';
import { useStyleMode } from '../pixel.jsx';

// สีโคม: ภาพต้นฉบับเป็นสีส้ม เปลี่ยนสีด้วย CSS filter
export const LANTERN_COLORS = {
  orange: { label: 'ส้ม', swatch: '#F28C28', filter: 'none' },
  red: { label: 'แดง', swatch: '#E0402C', filter: 'hue-rotate(-16deg) saturate(1.35)' },
  gold: { label: 'ทอง', swatch: '#F2C440', filter: 'hue-rotate(16deg) saturate(1.1) brightness(1.08)' },
  pink: { label: 'ชมพู', swatch: '#F07AA8', filter: 'hue-rotate(-42deg) saturate(.85) brightness(1.06)' }
};

/** ภาพโคมลอย 1 ลูก (โหมด 8-bit ใช้ภาพพิกเซล) */
export default function Lantern({ color = 'orange', size = 60, flip = false, className = '' }) {
  const { pixel } = useStyleMode();
  const c = LANTERN_COLORS[color] || LANTERN_COLORS.orange;
  return (
    <img
      className={`lantern-img ${className}`}
      src={pixel ? lanternPixelSrc : lanternSrc}
      alt=""
      draggable="false"
      width={size}
      height={Math.round(size * 1.305)}
      style={{ '--tint': c.filter === 'none' ? undefined : c.filter, transform: flip ? 'scaleX(-1)' : undefined }}
    />
  );
}