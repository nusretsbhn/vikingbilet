const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const SALT_ROUNDS = 12;

router.use(auth);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, role, is_active, created_at, updated_at
       FROM users ORDER BY id ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/', async (req, res) => {
  const { username, email, password, role = 'viewer' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı, e-posta ve şifre gerekli' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
  }

  const validRoles = ['admin', 'editor', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, is_active, created_at`,
      [username, email, passwordHash, role]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' });
    }
    console.error('User create error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { username, email, role, is_active, password } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (username !== undefined) {
    fields.push(`username = $${idx++}`);
    values.push(username);
  }
  if (email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(email);
  }
  if (role !== undefined) {
    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol' });
    }
    fields.push(`role = $${idx++}`);
    values.push(role);
  }
  if (is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(is_active);
  }
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    fields.push(`password_hash = $${idx++}`);
    values.push(passwordHash);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, username, email, role, is_active, created_at, updated_at`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda' });
    }
    console.error('User update error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Geçersiz kullanıcı ID' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı silindi' });
  } catch (err) {
    console.error('User delete error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
