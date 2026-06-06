require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');

const SALT_ROUNDS = 12;

async function createAdmin() {
  const [username, email, password] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error('Kullanım: node scripts/create-admin.js <username> <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Şifre en az 8 karakter olmalı');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (username) DO UPDATE
       SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = 'admin', updated_at = NOW()
       RETURNING id, username, email, role`,
      [username, email, passwordHash]
    );

    console.log('Admin kullanıcı oluşturuldu/güncellendi:', rows[0]);
  } catch (err) {
    console.error('Admin oluşturma hatası:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
