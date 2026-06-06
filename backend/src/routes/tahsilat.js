const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(auth);

router.get('/acenta-list', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT gelen_yer AS acenta_adi
       FROM biletler
       WHERE gelen_yer IS NOT NULL AND gelen_yer != ''
       ORDER BY gelen_yer ASC`
    );
    res.json({ acentalar: rows.map((r) => r.acenta_adi) });
  } catch (err) {
    console.error('Acenta list error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/', async (req, res) => {
  const { acenta } = req.query;

  try {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (acenta) {
      conditions.push(`acenta_adi ILIKE $${idx++}`);
      values.push(`%${acenta}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT t.*, u.username AS created_by_username
       FROM tahsilat_kayitlari t
       LEFT JOIN users u ON u.id = t.created_by
       ${whereClause}
       ORDER BY tahsilat_tarihi DESC, id DESC`,
      values
    );

    let toPayOdeme = [];
    let toPayToplam = 0;

    if (acenta) {
      const toPayResult = await pool.query(
        `SELECT id, tur_tarihi, bilet_no, isim, teknede_odeme AS tutar
         FROM biletler
         WHERE gelen_yer ILIKE $1 AND teknede_odeme > 0
         ORDER BY tur_tarihi DESC, id DESC`,
        [`%${acenta}%`]
      );
      toPayOdeme = toPayResult.rows;
      toPayToplam = toPayOdeme.reduce((sum, r) => sum + parseFloat(r.tutar), 0);
    }

    const biletHesapToplam = rows.reduce((sum, r) => sum + parseFloat(r.tutar), 0);

    res.json({
      tahsilatlar: rows,
      to_pay_odemeler: toPayOdeme,
      ozet: acenta ? {
        to_pay_toplam: toPayToplam,
        bilet_hesap_toplam: biletHesapToplam,
        toplam_tahsilat: toPayToplam + biletHesapToplam,
      } : undefined,
    });
  } catch (err) {
    console.error('Tahsilat list error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/', requireRole('editor'), async (req, res) => {
  const { acenta_adi, tahsilat_tarihi, tutar, aciklama } = req.body;

  if (!acenta_adi || !tahsilat_tarihi || tutar === undefined) {
    return res.status(400).json({ error: 'Acenta adı, tahsilat tarihi ve tutar zorunludur' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tahsilat_kayitlari (acenta_adi, tahsilat_tarihi, tutar, aciklama, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [acenta_adi, tahsilat_tarihi, tutar, aciklama || null, req.user.id]
    );

    res.status(201).json({ tahsilat: rows[0] });
  } catch (err) {
    console.error('Tahsilat create error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.delete('/:id', requireRole('editor'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz tahsilat ID' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM tahsilat_kayitlari WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Tahsilat kaydı bulunamadı' });
    }
    res.json({ message: 'Tahsilat kaydı silindi' });
  } catch (err) {
    console.error('Tahsilat delete error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
