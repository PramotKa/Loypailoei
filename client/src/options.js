export const BASES = {
  banana:  { label: 'หยวกกล้วย', note: 'ย่อยสลายได้', body: '#C9D89A', top: '#E3EBC0', line: '#9DB06A' },
  bread:   { label: 'ขนมปัง', note: 'เป็นอาหารปลา', body: '#C98B4E', top: '#E2AF72', line: '#A86B33' },
  coconut: { label: 'กะลามะพร้าว', note: 'ใช้ซ้ำได้', body: '#6E4428', top: '#8C5A36', line: '#4E2F1B' }
};

export const PETALS = {
  leaf:   { label: 'ใบตอง', color: '#4E9A63', edge: '#2F6B40' },
  lotus:  { label: 'ชมพูบัว', color: '#F29BB5', edge: '#C76A88' },
  gold:   { label: 'ทอง', color: '#E3B448', edge: '#A97F20' },
  orchid: { label: 'ม่วงกล้วยไม้', color: '#A77BD6', edge: '#7650A6' }
};

export const FLOWERS = {
  marigold: { label: 'ดาวเรือง', color: '#F5A524', edge: '#C77A0A', center: '#B8600A' },
  rose:     { label: 'กุหลาบ', color: '#E5484D', edge: '#A8252A', center: '#8A1C20' },
  jasmine:  { label: 'มะลิ', color: '#FFF8EA', edge: '#D9CDB2', center: '#E9C46A' },
  orchid:   { label: 'กล้วยไม้', color: '#D7A6F2', edge: '#9E63C4', center: '#F5D76E' }
};

export const FOLDS = {
  phanom: { label: 'พนมมือ', note: 'กลีบแหลมซ้อน 3 ชั้น' },
  rose: { label: 'กลีบกุหลาบ', note: 'กลีบมนม้วนปลาย' },
  nail: { label: 'เล็บมือนาง', note: 'กลีบเรียวเรียงถี่' },
  thorn: { label: 'หนามขนุน', note: 'หนามเล็กเรียงเป็นเกล็ด' }
};

export const DEFAULT_KRATHONG = {
  base: 'banana', petal: 'leaf', flower: 'marigold', candle: true, incense: true, name: '', wish: ''
};
