export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR');
}

export function fmtNum(value) {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('tr-TR').format(num);
}

export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

export function fmtTL(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(num);
}

export function calcKomisyon(satis, alis) {
  if (satis === null || satis === undefined || satis === '') return null;
  const satisNum = parseFloat(satis);
  if (Number.isNaN(satisNum)) return null;
  return satisNum - (parseFloat(alis) || 0);
}

export function parseOptionalPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

export function parseMoneyDefaultZero(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}
