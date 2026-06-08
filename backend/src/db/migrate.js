const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE biletler
        ALTER COLUMN satis_fiyati DROP DEFAULT,
        ALTER COLUMN alis_fiyati DROP DEFAULT,
        ALTER COLUMN teknede_odeme DROP DEFAULT
    `);

    await client.query(`
      ALTER TABLE biletler
        ALTER COLUMN satis_fiyati DROP NOT NULL,
        ALTER COLUMN alis_fiyati DROP NOT NULL
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'biletler' AND column_name = 'komisyon'
        ) THEN
          ALTER TABLE biletler DROP COLUMN komisyon;
        END IF;
      END $$
    `);

    await client.query(`
      ALTER TABLE biletler
      ADD COLUMN IF NOT EXISTS komisyon NUMERIC(12,2)
      GENERATED ALWAYS AS (
        CASE
          WHEN satis_fiyati IS NULL THEN NULL
          ELSE satis_fiyati - COALESCE(alis_fiyati, 0)
        END
      ) STORED
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_biletler_m ON biletler(m)
      WHERE m IS NOT NULL AND TRIM(m) != ''
    `);

    await client.query('COMMIT');
    console.log('Database migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
