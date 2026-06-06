import * as XLSX from 'xlsx';

const SHEET_NAME = 'sayfa1';
const DATA_START_ROW = 3;

const COL = {
  TUR_TARIHI: 3,
  BILET_NO: 4,
  BUYUK_KISI: 5,
  KUCUK_KISI: 6,
  FREE_KISI: 7,
  SATIS_FIYATI: 8,
  ALIS_FIYATI: 9,
  OTEL: 12,
  ISIM: 15,
  GELEN_YER: 16,
  DURUM: 17,
};

function cell(row, idx) {
  const val = row[idx];
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
}

function excelDateToISO(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && value > 0) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  return null;
}

function isValidDataRow(row) {
  const turTarihi = cell(row, COL.TUR_TARIHI);
  const buyuk = cell(row, COL.BUYUK_KISI);
  const kucuk = cell(row, COL.KUCUK_KISI);
  const isim = cell(row, COL.ISIM);
  const gelenYer = cell(row, COL.GELEN_YER);
  const biletNo = cell(row, COL.BILET_NO);

  if (!turTarihi && !buyuk && !kucuk && !isim && !gelenYer && !biletNo) return false;
  if (!turTarihi && !buyuk && !kucuk) return false;
  return true;
}

export function parseVikingPreview(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === SHEET_NAME) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: true });

  const preview = [];
  let total = 0;

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i];
    if (!isValidDataRow(row)) continue;

    const turTarihi = excelDateToISO(cell(row, COL.TUR_TARIHI));
    if (!turTarihi) continue;

    total++;
    if (preview.length < 5) {
      const satisRaw = parseFloat(cell(row, COL.SATIS_FIYATI)) || 0;
      const alisRaw = parseFloat(cell(row, COL.ALIS_FIYATI)) || 0;
      let satis = 0;
      let alis = 0;
      if (satisRaw > 0 && alisRaw > 0) {
        satis = alisRaw;
        alis = Math.max(0, 2 * alisRaw - satisRaw);
      } else if (alisRaw > 0) {
        satis = alisRaw;
      } else if (satisRaw > 0) {
        satis = satisRaw;
      }

      preview.push({
        'Tur Tarihi': turTarihi,
        'Bilet No': cell(row, COL.BILET_NO) || '—',
        'Büyük': cell(row, COL.BUYUK_KISI) || 0,
        'Küçük': cell(row, COL.KUCUK_KISI) || 0,
        'Satış': satis,
        'Alış': alis,
        'İsim': cell(row, COL.ISIM) || '—',
        'Acenta': cell(row, COL.GELEN_YER) || '—',
        'Durum': cell(row, COL.DURUM) || '—',
      });
    }
  }

  return { preview, total, sheetName };
}
