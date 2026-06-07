const XLSX = require('xlsx');

const SHEET_NAME = 'sayfa1';
const DATA_START_ROW = 3;

const COL = {
  M: 1,
  NOTLAR: 2,
  TUR_TARIHI: 3,
  BILET_NO: 4,
  BUYUK_KISI: 5,
  KUCUK_KISI: 6,
  FREE_KISI: 7,
  SATIS_FIYATI: 8,
  ALIS_FIYATI: 9,
  TEKNEDE_ODEME: 10,
  OTEL: 12,
  ODA: 13,
  ILETISIM: 14,
  ISIM: 15,
  GELEN_YER: 16,
  DURUM: 17,
  SON_SIRA_NOTU: 18,
  NAKIT: 19,
  KREDI_KARTI: 20,
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

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function parseIntSafe(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseInt(String(val), 10);
  return Number.isNaN(n) ? 0 : n;
}

function excelDateToISO(value) {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    if (/^\d{2}[./]\d{2}[./]\d{4}/.test(trimmed)) {
      const [d, m, y] = trimmed.split(/[./]/);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
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

  if (!turTarihi && !buyuk && !kucuk && !isim && !gelenYer && !biletNo) {
    return false;
  }

  if (!turTarihi && !buyuk && !kucuk) {
    return false;
  }

  return true;
}

function rowToBilet(row) {
  const turTarihi = excelDateToISO(cell(row, COL.TUR_TARIHI));
  if (!turTarihi) return null;

  const satisRaw = cell(row, COL.SATIS_FIYATI);
  const alisRaw = cell(row, COL.ALIS_FIYATI);
  const toPayRaw = cell(row, COL.TEKNEDE_ODEME);

  return {
    m: cell(row, COL.M),
    notlar: cell(row, COL.NOTLAR),
    tur_tarihi: turTarihi,
    bilet_no: cell(row, COL.BILET_NO) ? String(cell(row, COL.BILET_NO)) : null,
    buyuk_kisi: parseIntSafe(cell(row, COL.BUYUK_KISI)),
    kucuk_kisi: parseIntSafe(cell(row, COL.KUCUK_KISI)),
    free_kisi: parseIntSafe(cell(row, COL.FREE_KISI)),
    satis_fiyati: parseNum(satisRaw),
    alis_fiyati: parseNum(alisRaw),
    teknede_odeme: parseNum(toPayRaw) ?? 0,
    otel: cell(row, COL.OTEL),
    oda: cell(row, COL.ODA),
    iletisim: cell(row, COL.ILETISIM) ? String(cell(row, COL.ILETISIM)) : null,
    isim: cell(row, COL.ISIM),
    gelen_yer: cell(row, COL.GELEN_YER),
    durum: cell(row, COL.DURUM),
    son_sira_notu: cell(row, COL.SON_SIRA_NOTU),
    nakit: parseNum(cell(row, COL.NAKIT)),
    kredi_karti: parseNum(cell(row, COL.KREDI_KARTI)),
  };
}

function parseVikingWorkbook(wb) {
  const sheetName = wb.SheetNames.find(
    (n) => n.toLowerCase() === SHEET_NAME.toLowerCase()
  ) || wb.SheetNames[0];

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });

  const biletler = [];
  const errors = [];

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i];
    if (!isValidDataRow(row)) continue;

    const bilet = rowToBilet(row);
    if (!bilet) {
      errors.push({ row: i + 1, reason: 'Geçersiz tur tarihi' });
      continue;
    }

    biletler.push(bilet);
  }

  return { biletler, sheetName, errors, totalRows: rows.length - DATA_START_ROW };
}

function parseVikingBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  return parseVikingWorkbook(wb);
}

function parseVikingFile(path) {
  const wb = XLSX.readFile(path, { cellDates: false });
  return parseVikingWorkbook(wb);
}

module.exports = {
  parseVikingBuffer,
  parseVikingFile,
  parseVikingWorkbook,
  excelDateToISO,
  COL,
  DATA_START_ROW,
  SHEET_NAME,
};
