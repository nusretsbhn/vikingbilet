const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { parseVikingBuffer } = require('../utils/excelImport');
const { normalizeBiletPrices } = require('../utils/fiyat');
const { syncImportedBiletler } = require('../utils/biletSync');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SORTABLE_COLUMNS = {
  tur_tarihi: 'tur_tarihi',
  bilet_no: 'bilet_no',
  buyuk_kisi: 'buyuk_kisi',
  kucuk_kisi: 'kucuk_kisi',
  satis_fiyati: 'satis_fiyati',
  alis_fiyati: 'alis_fiyati',
  teknede_odeme: 'teknede_odeme',
  komisyon: 'komisyon',
  gelen_yer: 'gelen_yer',
  durum: 'durum',
  created_at: 'created_at',
};

const BILET_FIELDS = [
  'm', 'notlar', 'tur_tarihi', 'bilet_no', 'buyuk_kisi', 'kucuk_kisi', 'free_kisi',
  'satis_fiyati', 'alis_fiyati', 'teknede_odeme', 'otel', 'oda', 'isim', 'iletisim',
  'gelen_yer', 'durum', 'son_sira_notu', 'nakit', 'kredi_karti',
];

function buildFilterQuery(query) {
  const {
    tur_tarihleri,
    tarih_baslangic,
    tarih_bitis,
    gelen_yer,
    durum,
    bilet_no,
    isim,
    sort_by = 'tur_tarihi',
    sort_dir = 'desc',
    page = '1',
    limit = '100',
  } = query;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (tur_tarihleri) {
    const dates = tur_tarihleri
      .split(',')
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (dates.length > 0) {
      conditions.push(`tur_tarihi = ANY($${idx++}::date[])`);
      values.push(dates);
    }
  } else {
    if (tarih_baslangic) {
      conditions.push(`tur_tarihi >= $${idx++}`);
      values.push(tarih_baslangic);
    }
    if (tarih_bitis) {
      conditions.push(`tur_tarihi <= $${idx++}`);
      values.push(tarih_bitis);
    }
  }
  if (gelen_yer) {
    conditions.push(`gelen_yer ILIKE $${idx++}`);
    values.push(`%${gelen_yer}%`);
  }
  if (durum) {
    conditions.push(`durum ILIKE $${idx++}`);
    values.push(`%${durum}%`);
  }
  if (bilet_no) {
    conditions.push(`bilet_no ILIKE $${idx++}`);
    values.push(`%${bilet_no}%`);
  }
  if (isim) {
    conditions.push(`isim ILIKE $${idx++}`);
    values.push(`%${isim}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortColumn = SORTABLE_COLUMNS[sort_by] || 'tur_tarihi';
  const sortDirection = sort_dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = limit === 'all' ? null : Math.min(10000, parseInt(limit, 10) || 100);
  const offset = limitNum ? (pageNum - 1) * limitNum : 0;

  return { whereClause, values, sortColumn, sortDirection, pageNum, limitNum, offset };
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { whereClause, values, sortColumn, sortDirection, pageNum, limitNum, offset } =
      buildFilterQuery(req.query);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM biletler ${whereClause}`,
      values
    );
    const total = countResult.rows[0].total;

    const totalsResult = await pool.query(
      `SELECT
         COALESCE(SUM(buyuk_kisi), 0)::int AS buyuk_kisi,
         COALESCE(SUM(kucuk_kisi), 0)::int AS kucuk_kisi,
         COALESCE(SUM(free_kisi), 0)::int AS free_kisi,
         COALESCE(SUM(satis_fiyati), 0)::float AS satis_fiyati,
         COALESCE(SUM(alis_fiyati), 0)::float AS alis_fiyati,
         COALESCE(SUM(teknede_odeme), 0)::float AS teknede_odeme,
         COALESCE(SUM(komisyon), 0)::float AS komisyon
       FROM biletler ${whereClause}`,
      values
    );

    let dataQuery = `SELECT * FROM biletler ${whereClause} ORDER BY ${sortColumn} ${sortDirection}`;
    const dataValues = [...values];

    if (limitNum) {
      dataQuery += ` LIMIT $${dataValues.length + 1} OFFSET $${dataValues.length + 2}`;
      dataValues.push(limitNum, offset);
    }

    const { rows } = await pool.query(dataQuery, dataValues);

    res.json({
      data: rows,
      totals: totalsResult.rows[0],
      pagination: {
        page: pageNum,
        limit: limitNum || total,
        total,
        totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
      },
    });
  } catch (err) {
    console.error('Biletler list error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const { whereClause, values, sortColumn, sortDirection } = buildFilterQuery(req.query);

    const { rows } = await pool.query(
      `SELECT tur_tarihi, bilet_no, buyuk_kisi, kucuk_kisi, free_kisi,
              satis_fiyati, alis_fiyati, komisyon, otel, oda, isim, iletisim,
              gelen_yer, durum, m, notlar, teknede_odeme, nakit, kredi_karti
       FROM biletler ${whereClause} ORDER BY ${sortColumn} ${sortDirection}`,
      values
    );

    const sheetData = rows.map((r) => ({
      'Tur Tarihi': r.tur_tarihi,
      'Bilet No': r.bilet_no,
      'Büyük': r.buyuk_kisi,
      'Küçük': r.kucuk_kisi,
      'Free': r.free_kisi,
      'Satış Fiyatı (₺)': r.satis_fiyati,
      'Alış Fiyatı (₺)': r.alis_fiyati,
      'To Pay (₺)': r.teknede_odeme,
      'Komisyon (₺)': r.komisyon,
      'Otel': r.otel,
      'Oda': r.oda,
      'İsim': r.isim,
      'İletişim': r.iletisim,
      'Acenta': r.gelen_yer,
      'Durum': r.durum,
      'M': r.m,
      'Notlar': r.notlar,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Biletler');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="biletler.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error('Biletler export error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz bilet ID' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM biletler WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }
    res.json({ bilet: rows[0] });
  } catch (err) {
    console.error('Bilet get error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

function buildInsertPayload(data, userId) {
  const fields = [];
  const placeholders = [];
  const values = [];
  let idx = 1;

  for (const field of BILET_FIELDS) {
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

router.post('/', requireRole('editor'), async (req, res) => {
  const data = normalizeBiletPrices(req.body);

  if (!data.tur_tarihi) {
    return res.status(400).json({ error: 'Tur tarihi zorunludur' });
  }

  const { sql, values } = buildInsertPayload(data, req.user.id);

  try {
    const { rows } = await pool.query(sql, values);
    res.status(201).json({ bilet: rows[0] });
  } catch (err) {
    console.error('Bilet create error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/bulk', requireRole('editor'), async (req, res) => {
  const { biletler } = req.body;

  if (!Array.isArray(biletler) || biletler.length === 0) {
    return res.status(400).json({ error: 'En az bir bilet gerekli' });
  }

  if (biletler.length > 50) {
    return res.status(400).json({ error: 'Tek seferde en fazla 50 bilet eklenebilir' });
  }

  const prepared = biletler
    .map((item) => normalizeBiletPrices(item))
    .filter((b) => b?.tur_tarihi);

  const valid = prepared.filter((b) => b.alis_fiyati !== null);
  const skipped = prepared.length - valid.length;

  if (valid.length === 0) {
    return res.status(400).json({
      error: skipped > 0
        ? 'Kaydedilecek bilet yok. Alış fiyatı girilmiş en az bir satır gerekli.'
        : 'Tur tarihi olan en az bir satır gerekli',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const created = [];

    for (const data of valid) {
      const { sql, values } = buildInsertPayload(data, req.user.id);
      const { rows } = await client.query(sql, values);
      created.push(rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ biletler: created, count: created.length, skipped });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bilet bulk create error:', err);
    res.status(500).json({ error: 'Toplu kayıt başarısız' });
  } finally {
    client.release();
  }
});

router.put('/:id', requireRole('editor'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz bilet ID' });
  }

  const data = normalizeBiletPrices(req.body);
  const fields = [];
  const values = [];
  let idx = 1;

  for (const field of BILET_FIELDS) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
  }

  fields.push(`updated_by = $${idx++}`, 'updated_at = NOW()');
  values.push(req.user.id, id);

  try {
    const { rows } = await pool.query(
      `UPDATE biletler SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }

    res.json({ bilet: rows[0] });
  } catch (err) {
    console.error('Bilet update error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz bilet ID' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM biletler WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }
    res.json({ message: 'Bilet silindi' });
  } catch (err) {
    console.error('Bilet delete error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/import', requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Excel dosyası gerekli' });
  }

  try {
    const { biletler, sheetName, errors } = parseVikingBuffer(req.file.buffer);

    if (biletler.length === 0) {
      return res.status(400).json({
        error: 'Dosyada geçerli bilet kaydı bulunamadı. sayfa1 formatını kontrol edin.',
        skipped: errors.length,
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { inserted, updated, skipped } = await syncImportedBiletler(
        client,
        biletler,
        req.user.id
      );

      await client.query('COMMIT');
      res.json({
        message: `${inserted} eklendi, ${updated} güncellendi, ${skipped} atlandı`,
        inserted,
        updated,
        skipped,
        count: inserted + updated,
        sheet: sheetName,
        parseErrors: errors.length,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Bilet import error:', err);
    res.status(500).json({ error: 'İçe aktarma başarısız' });
  }
});

module.exports = router;
