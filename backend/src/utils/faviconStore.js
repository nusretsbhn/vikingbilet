const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const FAVICON_KEY = 'favicon';

const ALLOWED_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
};

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function removeFaviconFiles() {
  ensureUploadsDir();
  for (const name of fs.readdirSync(UPLOADS_DIR)) {
    if (name.startsWith('favicon.')) {
      fs.unlinkSync(path.join(UPLOADS_DIR, name));
    }
  }
}

async function getFaviconMeta() {
  const { rows } = await pool.query(
    'SELECT value, updated_at FROM app_settings WHERE key = $1',
    [FAVICON_KEY]
  );

  if (!rows.length) {
    return { custom: false };
  }

  const data = JSON.parse(rows[0].value);
  return {
    custom: true,
    mimeType: data.mimeType,
    filename: data.filename,
    updatedAt: rows[0].updated_at,
  };
}

async function getFaviconPath() {
  const meta = await getFaviconMeta();
  if (!meta.custom) return null;

  const filePath = path.join(UPLOADS_DIR, meta.filename);
  if (!fs.existsSync(filePath)) return null;

  return { filePath, mimeType: meta.mimeType };
}

async function saveFavicon(filename, mimeType, userId) {
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = $2, updated_by = $3, updated_at = NOW()`,
    [FAVICON_KEY, JSON.stringify({ filename, mimeType }), userId]
  );
}

async function deleteFavicon() {
  removeFaviconFiles();
  await pool.query('DELETE FROM app_settings WHERE key = $1', [FAVICON_KEY]);
}

module.exports = {
  ALLOWED_MIME,
  UPLOADS_DIR,
  ensureUploadsDir,
  removeFaviconFiles,
  getFaviconMeta,
  getFaviconPath,
  saveFavicon,
  deleteFavicon,
};
