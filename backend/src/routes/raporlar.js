const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { generateAcentaDokumPdf } = require('../utils/acentaDokumPdf');

const router = express.Router();

router.use(auth);

router.get('/ozet', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS toplam_bilet,
        COALESCE(SUM(buyuk_kisi + kucuk_kisi + free_kisi), 0)::int AS toplam_kisi,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS toplam_ciro,
        COALESCE(SUM(komisyon), 0)::numeric AS toplam_komisyon
      FROM biletler
    `);

    const durumResult = await pool.query(`
      SELECT COALESCE(durum, 'Boş') AS durum, COUNT(*)::int AS adet
      FROM biletler
      GROUP BY durum
      ORDER BY adet DESC
    `);

    const aylikResult = await pool.query(`
      SELECT
        TO_CHAR(tur_tarihi, 'YYYY-MM') AS ay,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS ciro
      FROM biletler
      WHERE tur_tarihi >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY TO_CHAR(tur_tarihi, 'YYYY-MM')
      ORDER BY ay ASC
    `);

    const sonBiletler = await pool.query(`
      SELECT id, tur_tarihi, bilet_no, isim, gelen_yer, satis_fiyati, durum
      FROM biletler
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      ozet: rows[0],
      durumDagilimi: durumResult.rows,
      aylikCiro: aylikResult.rows,
      sonBiletler: sonBiletler.rows,
    });
  } catch (err) {
    console.error('Rapor ozet error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/acentalar', async (req, res) => {
  const { acenta } = req.query;

  try {
    const conditions = ['gelen_yer IS NOT NULL', "gelen_yer != ''"];
    const values = [];
    let idx = 1;

    if (acenta) {
      conditions.push(`gelen_yer ILIKE $${idx++}`);
      values.push(`%${acenta}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await pool.query(
      `SELECT
        b.gelen_yer AS acenta_adi,
        COALESCE(SUM(b.buyuk_kisi), 0)::int AS buyuk,
        COALESCE(SUM(b.kucuk_kisi), 0)::int AS kucuk,
        COALESCE(SUM(b.buyuk_kisi + b.kucuk_kisi + b.free_kisi), 0)::int AS toplam_kisi,
        COALESCE(SUM(b.satis_fiyati), 0)::numeric AS toplam_satis,
        COALESCE(SUM(b.teknede_odeme), 0)::numeric AS to_pay_odeme,
        COALESCE(t.tahsilat, 0)::numeric AS bilet_hesap_tahsilat,
        (COALESCE(SUM(b.teknede_odeme), 0) + COALESCE(t.tahsilat, 0))::numeric AS toplam_tahsilat,
        (COALESCE(SUM(b.satis_fiyati), 0)
          - COALESCE(SUM(b.teknede_odeme), 0)
          - COALESCE(t.tahsilat, 0))::numeric AS kalan_alacak
      FROM biletler b
      LEFT JOIN (
        SELECT acenta_adi, SUM(tutar) AS tahsilat
        FROM tahsilat_kayitlari
        GROUP BY acenta_adi
      ) t ON t.acenta_adi = b.gelen_yer
      ${whereClause}
      GROUP BY b.gelen_yer, t.tahsilat
      ORDER BY kalan_alacak DESC, b.gelen_yer ASC`,
      values
    );

    res.json({ acentalar: rows });
  } catch (err) {
    console.error('Rapor acentalar error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/acenta-dokum', async (req, res) => {
  const { acenta, tarih_baslangic, tarih_bitis } = req.query;

  if (!acenta || !tarih_baslangic || !tarih_bitis) {
    return res.status(400).json({ error: 'Acenta adı, tarih başlangıç ve tarih bitiş zorunludur' });
  }

  try {
    const acentaFilter = acenta.trim();

    const biletResult = await pool.query(
      `SELECT tur_tarihi, bilet_no, buyuk_kisi, kucuk_kisi, free_kisi,
              satis_fiyati, teknede_odeme, isim, durum, otel
       FROM biletler
       WHERE gelen_yer ILIKE $1
         AND tur_tarihi >= $2
         AND tur_tarihi <= $3
       ORDER BY tur_tarihi ASC, id ASC`,
      [acentaFilter, tarih_baslangic, tarih_bitis]
    );

    const tahsilatResult = await pool.query(
      `SELECT tahsilat_tarihi, tutar, aciklama
       FROM tahsilat_kayitlari
       WHERE acenta_adi ILIKE $1
         AND tahsilat_tarihi >= $2
         AND tahsilat_tarihi <= $3
       ORDER BY tahsilat_tarihi ASC, id ASC`,
      [acentaFilter, tarih_baslangic, tarih_bitis]
    );

    const ozetResult = await pool.query(
      `SELECT
        COUNT(*)::int AS bilet_sayisi,
        COALESCE(SUM(buyuk_kisi + kucuk_kisi + free_kisi), 0)::int AS toplam_kisi,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS toplam_satis,
        COALESCE(SUM(teknede_odeme), 0)::numeric AS to_pay_odeme
       FROM biletler
       WHERE gelen_yer ILIKE $1
         AND tur_tarihi >= $2
         AND tur_tarihi <= $3`,
      [acentaFilter, tarih_baslangic, tarih_bitis]
    );

    const tahsilatToplam = tahsilatResult.rows.reduce(
      (sum, r) => sum + parseFloat(r.tutar),
      0
    );

    const ozet = ozetResult.rows[0];
    const toplamSatis = parseFloat(ozet.toplam_satis);
    const toPay = parseFloat(ozet.to_pay_odeme);
    const biletHesap = tahsilatToplam;
    const toplamTahsilat = toPay + biletHesap;
    const kalanAlacak = toplamSatis - toplamTahsilat;

    const pdfBuffer = await generateAcentaDokumPdf({
      acenta_adi: acentaFilter,
      tarih_baslangic,
      tarih_bitis,
      biletler: biletResult.rows,
      tahsilatlar: tahsilatResult.rows,
      ozet: {
        bilet_sayisi: ozet.bilet_sayisi,
        toplam_kisi: ozet.toplam_kisi,
        toplam_satis: toplamSatis,
        to_pay_odeme: toPay,
        bilet_hesap_tahsilat: biletHesap,
        toplam_tahsilat: toplamTahsilat,
        kalan_alacak: kalanAlacak,
      },
    });

    const safeName = acentaFilter
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const filename = `hizmet-dokumu_${safeName}_${tarih_baslangic}_${tarih_bitis}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Acenta dokum error:', err);
    res.status(500).json({ error: 'PDF oluşturulamadı' });
  }
});

router.get('/gunluk', async (req, res) => {
  const yil = parseInt(req.query.yil || new Date().getFullYear(), 10);
  const ay = parseInt(req.query.ay || new Date().getMonth() + 1, 10);

  try {
    const { rows } = await pool.query(
      `SELECT
        tur_tarihi AS tarih,
        COALESCE(SUM(buyuk_kisi), 0)::int AS buyuk,
        COALESCE(SUM(kucuk_kisi), 0)::int AS kucuk,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS gunluk_ciro,
        CASE
          WHEN SUM(buyuk_kisi + kucuk_kisi / 2.0) > 0
          THEN (SUM(satis_fiyati) / SUM(buyuk_kisi + kucuk_kisi / 2.0))::numeric(12,2)
          ELSE 0
        END AS kisi_basi_ort
      FROM biletler
      WHERE EXTRACT(YEAR FROM tur_tarihi) = $1
        AND EXTRACT(MONTH FROM tur_tarihi) = $2
      GROUP BY tur_tarihi
      ORDER BY tur_tarihi ASC`,
      [yil, ay]
    );

    res.json({ rapor: rows, yil, ay });
  } catch (err) {
    console.error('Rapor gunluk error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/aylik', async (req, res) => {
  const yil = parseInt(req.query.yil || new Date().getFullYear(), 10);

  try {
    const { rows } = await pool.query(
      `SELECT
        EXTRACT(MONTH FROM tur_tarihi)::int AS ay,
        COALESCE(SUM(buyuk_kisi + kucuk_kisi + free_kisi), 0)::int AS toplam_kisi,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS aylik_ciro,
        CASE
          WHEN SUM(buyuk_kisi + kucuk_kisi / 2.0) > 0
          THEN (SUM(satis_fiyati) / SUM(buyuk_kisi + kucuk_kisi / 2.0))::numeric(12,2)
          ELSE 0
        END AS kisi_basi_ort
      FROM biletler
      WHERE EXTRACT(YEAR FROM tur_tarihi) = $1
      GROUP BY EXTRACT(MONTH FROM tur_tarihi)
      ORDER BY ay ASC`,
      [yil]
    );

    res.json({ rapor: rows, yil });
  } catch (err) {
    console.error('Rapor aylik error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/yillik', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM tur_tarihi)::int AS yil,
        COALESCE(SUM(buyuk_kisi + kucuk_kisi + free_kisi), 0)::int AS toplam_kisi,
        COALESCE(SUM(satis_fiyati), 0)::numeric AS yillik_ciro,
        CASE
          WHEN SUM(buyuk_kisi + kucuk_kisi / 2.0) > 0
          THEN (SUM(satis_fiyati) / SUM(buyuk_kisi + kucuk_kisi / 2.0))::numeric(12,2)
          ELSE 0
        END AS kisi_basi_ort
      FROM biletler
      GROUP BY EXTRACT(YEAR FROM tur_tarihi)
      ORDER BY yil ASC
    `);

    res.json({ rapor: rows });
  } catch (err) {
    console.error('Rapor yillik error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
