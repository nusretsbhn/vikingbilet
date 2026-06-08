const { normalizeBiletPrices } = require('./fiyat');

const SYNC_FIELDS = [
  'm', 'notlar', 'tur_tarihi', 'bilet_no', 'buyuk_kisi', 'kucuk_kisi', 'free_kisi',
  'satis_fiyati', 'alis_fiyati', 'teknede_odeme', 'otel', 'oda', 'isim', 'iletisim',
  'gelen_yer', 'durum', 'son_sira_notu', 'nakit', 'kredi_karti',
];

function normStr(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function normDate(val) {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  return s ? s.slice(0, 10) : null;
}

function normNum(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : n;
}

function normMoneyZero(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
}

function normInt(val) {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? 0 : n;
}

function buildMatchKey(b) {
  const date = normDate(b.tur_tarihi);
  if (!date) return null;

  const biletNo = normStr(b.bilet_no);
  if (biletNo) {
    return `no:${date}|${biletNo.toLowerCase()}`;
  }

  const parts = [
    date,
    normStr(b.gelen_yer)?.toLowerCase() || '',
    normStr(b.isim)?.toLowerCase() || '',
    normInt(b.buyuk_kisi),
    normInt(b.kucuk_kisi),
    normInt(b.free_kisi),
    normStr(b.otel)?.toLowerCase() || '',
    normStr(b.oda)?.toLowerCase() || '',
    normNum(b.alis_fiyati),
    normNum(b.satis_fiyati),
    normMoneyZero(b.teknede_odeme),
    normStr(b.iletisim)?.toLowerCase() || '',
  ];

  return `row:${parts.join('|')}`;
}

function snapshotForCompare(b) {
  return {
    m: normStr(b.m),
    notlar: normStr(b.notlar),
    tur_tarihi: normDate(b.tur_tarihi),
    bilet_no: normStr(b.bilet_no),
    buyuk_kisi: normInt(b.buyuk_kisi),
    kucuk_kisi: normInt(b.kucuk_kisi),
    free_kisi: normInt(b.free_kisi),
    satis_fiyati: normNum(b.satis_fiyati),
    alis_fiyati: normNum(b.alis_fiyati),
    teknede_odeme: normMoneyZero(b.teknede_odeme),
    otel: normStr(b.otel),
    oda: normStr(b.oda),
    isim: normStr(b.isim),
    iletisim: normStr(b.iletisim),
    gelen_yer: normStr(b.gelen_yer),
    durum: normStr(b.durum),
    son_sira_notu: normStr(b.son_sira_notu),
    nakit: normNum(b.nakit),
    kredi_karti: normNum(b.kredi_karti),
  };
}

function recordsEqual(a, b) {
  return JSON.stringify(snapshotForCompare(a)) === JSON.stringify(snapshotForCompare(b));
}

function buildInsertPayload(data, userId) {
  const fields = [];
  const placeholders = [];
  const values = [];
  let idx = 1;

  for (const field of SYNC_FIELDS) {
    if (data[field] !== undefined) {
      fields.push(field);
      placeholders.push(`$${idx++}`);
      values.push(data[field]);
    }
  }

  fields.push('created_by', 'updated_by');
  placeholders.push(`$${idx++}`, `$${idx++}`);
  values.push(userId, userId);

  return {
    sql: `INSERT INTO biletler (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values,
  };
}

async function syncImportedBiletler(client, biletler, userId) {
  if (biletler.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const dates = biletler.map((b) => b.tur_tarihi).filter(Boolean);
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  const { rows: existingRows } = await client.query(
    'SELECT * FROM biletler WHERE tur_tarihi >= $1 AND tur_tarihi <= $2',
    [minDate, maxDate]
  );

  const existingByKey = new Map();
  for (const row of existingRows) {
    const key = buildMatchKey(row);
    if (key && !existingByKey.has(key)) {
      existingByKey.set(key, row);
    }
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const raw of biletler) {
    const data = normalizeBiletPrices({ ...raw });
    const key = buildMatchKey(data);
    if (!key) continue;

    const existing = existingByKey.get(key);

    if (!existing) {
      const { sql, values } = buildInsertPayload(data, userId);
      await client.query(sql, values);
      inserted++;
      continue;
    }

    if (recordsEqual(existing, data)) {
      skipped++;
      continue;
    }

    const fields = [];
    const values = [];
    let idx = 1;

    for (const field of SYNC_FIELDS) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(data[field]);
      }
    }

    fields.push(`updated_by = $${idx++}`, 'updated_at = NOW()');
    values.push(userId, existing.id);

    const { rows } = await client.query(
      `UPDATE biletler SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    existingByKey.set(key, rows[0]);
    updated++;
  }

  return { inserted, updated, skipped };
}

module.exports = {
  buildMatchKey,
  recordsEqual,
  syncImportedBiletler,
};
