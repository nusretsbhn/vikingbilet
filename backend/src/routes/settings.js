const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  ALLOWED_MIME,
  UPLOADS_DIR,
  ensureUploadsDir,
  removeFaviconFiles,
  getFaviconMeta,
  getFaviconPath,
  saveFavicon,
  deleteFavicon,
} = require('../utils/faviconStore');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. PNG, JPG, ICO, SVG veya WebP yükleyin.'));
    }
  },
});

router.get('/favicon/config', async (_req, res) => {
  try {
    const meta = await getFaviconMeta();
    res.json(meta);
  } catch (err) {
    console.error('Favicon config error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/favicon', async (_req, res) => {
  try {
    const favicon = await getFaviconPath();
    if (!favicon) {
      return res.status(404).json({ error: 'Özel favicon bulunamadı' });
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type(favicon.mimeType);
    res.sendFile(favicon.filePath);
  } catch (err) {
    console.error('Favicon serve error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/favicon', auth, requireRole('admin'), upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Favicon dosyası gerekli' });
    }

    const ext = ALLOWED_MIME[req.file.mimetype];
    const filename = `favicon${ext}`;

    removeFaviconFiles();
    ensureUploadsDir();
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);

    await saveFavicon(filename, req.file.mimetype, req.user.id);
    const meta = await getFaviconMeta();

    res.json({ message: 'Favicon yüklendi', ...meta });
  } catch (err) {
    console.error('Favicon upload error:', err);
    res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
});

router.post('/purge-data', auth, requireRole('admin'), async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Şifre gerekli' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Şifre hatalı' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE tahsilat_kayitlari RESTART IDENTITY');
      await client.query('TRUNCATE TABLE biletler RESTART IDENTITY');
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Tüm bilet ve cari kayıtları silindi' });
  } catch (err) {
    console.error('Purge data error:', err);
    res.status(500).json({ error: 'Veriler silinemedi' });
  }
});

router.delete('/favicon', auth, requireRole('admin'), async (req, res) => {
  try {
    await deleteFavicon();
    res.json({ message: 'Favicon varsayılana sıfırlandı', custom: false });
  } catch (err) {
    console.error('Favicon delete error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Dosya boyutu en fazla 512 KB olabilir'
      : err.message;
    return res.status(400).json({ error: message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
