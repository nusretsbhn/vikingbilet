const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getRefreshCookieOptions,
} = require('../utils/tokens');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, password_hash, is_active FROM users WHERE username = $1',
      [username]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());
    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }

  res.clearCookie('refreshToken', getRefreshCookieOptions());
  res.json({ message: 'Çıkış yapıldı' });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token bulunamadı' });
  }

  try {
    const tokenHash = hashToken(refreshToken);
    const { rows } = await pool.query(
      `SELECT rt.id, rt.user_id, u.username, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    const record = rows[0];
    if (!record || !record.is_active) {
      res.clearCookie('refreshToken', getRefreshCookieOptions());
      return res.status(401).json({ error: 'Geçersiz refresh token' });
    }

    await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [record.id]);

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [record.user_id, newTokenHash, expiresAt]
    );

    const accessToken = generateAccessToken({
      id: record.user_id,
      username: record.username,
      role: record.role,
    });

    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());
    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya pasif' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
