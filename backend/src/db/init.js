const pool = require('./pool');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(60)  UNIQUE NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'viewer',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biletler (
  id              SERIAL PRIMARY KEY,
  m               VARCHAR(100),
  notlar          TEXT,
  tur_tarihi      DATE        NOT NULL,
  bilet_no        VARCHAR(50),
  buyuk_kisi      INTEGER     DEFAULT 0,
  kucuk_kisi      INTEGER     DEFAULT 0,
  free_kisi       INTEGER     DEFAULT 0,
  satis_fiyati    NUMERIC(12,2),
  alis_fiyati     NUMERIC(12,2),
  teknede_odeme   NUMERIC(12,2) DEFAULT 0,
  komisyon        NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE
      WHEN satis_fiyati IS NULL THEN NULL
      ELSE satis_fiyati - COALESCE(alis_fiyati, 0)
    END
  ) STORED,
  otel            VARCHAR(200),
  oda             VARCHAR(100),
  isim            VARCHAR(300),
  iletisim        VARCHAR(100),
  gelen_yer       VARCHAR(200),
  durum           VARCHAR(100),
  son_sira_notu   TEXT,
  nakit           NUMERIC(12,2) DEFAULT 0,
  kredi_karti     NUMERIC(12,2) DEFAULT 0,
  created_by      INTEGER REFERENCES users(id),
  updated_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biletler_tur_tarihi ON biletler(tur_tarihi);
CREATE INDEX IF NOT EXISTS idx_biletler_gelen_yer  ON biletler(gelen_yer);
CREATE INDEX IF NOT EXISTS idx_biletler_durum      ON biletler(durum);
CREATE INDEX IF NOT EXISTS idx_biletler_bilet_no   ON biletler(bilet_no);
CREATE INDEX IF NOT EXISTS idx_biletler_m          ON biletler(m) WHERE m IS NOT NULL AND TRIM(m) != '';

CREATE TABLE IF NOT EXISTS tahsilat_kayitlari (
  id               SERIAL PRIMARY KEY,
  acenta_adi       VARCHAR(200) NOT NULL,
  tahsilat_tarihi  DATE         NOT NULL,
  tutar            NUMERIC(12,2) NOT NULL,
  aciklama         TEXT,
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tahsilat_acenta ON tahsilat_kayitlari(acenta_adi);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT         NOT NULL,
  updated_by  INTEGER REFERENCES users(id),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
`;

async function init() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
