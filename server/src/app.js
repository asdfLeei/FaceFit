const cors = require('cors');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

function publicUser(user) {
  return { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role };
}

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing from the server .env file.');
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });
}

function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ error: 'Authentication required.' });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return response.status(401).json({ error: 'Your session is invalid or expired.' });
  }
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/signup', async (request, response, next) => {
  const fullName = String(request.body.fullName || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const phone = String(request.body.phone || '').trim() || null;
  const password = String(request.body.password || '');
  const role = request.body.role === 'owner' ? 'owner' : 'customer';

  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return response.status(400).json({ error: 'Enter a valid name, email, and password of at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, phone, role],
    );
    const user = { id: result.insertId, full_name: fullName, email, phone, role };
    return response.status(201).json({ data: { user: publicUser(user), token: createToken(user) } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'An account with this email already exists.' });
    return next(error);
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  if (!email || !password) return response.status(400).json({ error: 'Email and password are required.' });

  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, password_hash FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ error: 'Incorrect email or password.' });
    }
    return response.json({ data: { user: publicUser(user), token: createToken(user) } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/profile', authenticate, async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name AS fullName, u.email, u.phone, u.role,
              u.created_at AS createdAt,
              cp.hair_type AS hairType, cp.hair_length AS hairLength,
              cp.hair_texture AS hairTexture,
              (SELECT fa.face_shape FROM face_analyses fa
               WHERE fa.user_id = u.id
               ORDER BY fa.created_at DESC, fa.id DESC LIMIT 1) AS faceShape
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [request.user.sub],
    );
    if (!rows[0]) return response.status(404).json({ error: 'Profile not found.' });
    return response.json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/account/:section', authenticate, async (request, response, next) => {
  const queries = {
    saved: `SELECT id, hairstyle_name AS title, saved_at AS createdAt FROM saved_hairstyles WHERE user_id = ? ORDER BY saved_at DESC`,
    salons: `SELECT s.id, s.name AS title, s.address AS detail, fs.created_at AS createdAt FROM favorite_salons fs JOIN salons s ON s.id = fs.salon_id WHERE fs.user_id = ? ORDER BY fs.created_at DESC`,
    notifications: `SELECT * FROM (
      SELECT id, title, message AS detail, is_read AS isRead, created_at AS createdAt
      FROM notifications WHERE user_id = ?
      UNION ALL
      SELECT -b.id AS id, CONCAT('Booking ', b.status) AS title,
             CONCAT(s.name, ' · ', sv.name, ' · ', DATE_FORMAT(b.appointment_at, '%b %e, %Y %l:%i %p')) AS detail,
             TRUE AS isRead, b.updated_at AS createdAt
      FROM bookings b
      JOIN services sv ON sv.id = b.service_id
      JOIN salons s ON s.id = sv.salon_id
      WHERE b.user_id = ?
    ) account_notifications ORDER BY createdAt DESC`,
    reviews: `SELECT r.id, s.name AS title, CONCAT(r.rating, ' / 5', IF(r.comment IS NULL OR r.comment = '', '', CONCAT(' · ', r.comment))) AS detail, r.created_at AS createdAt FROM reviews r JOIN salons s ON s.id = r.salon_id WHERE r.user_id = ? ORDER BY r.created_at DESC`,
  };
  const query = queries[request.params.section];
  if (!query) return response.status(404).json({ error: 'Account section not found.' });
  try {
    const parameters = request.params.section === 'notifications'
      ? [request.user.sub, request.user.sub]
      : [request.user.sub];
    const [rows] = await pool.execute(query, parameters);
    return response.json({ data: rows });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/account/saved', authenticate, async (request, response, next) => {
  const title = String(request.body.title || '').trim();
  if (!title) return response.status(400).json({ error: 'Hairstyle name is required.' });
  try {
    await pool.execute('INSERT IGNORE INTO saved_hairstyles (user_id, hairstyle_name) VALUES (?, ?)', [request.user.sub, title]);
    return response.status(201).json({ data: { title } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/favorite-salons', authenticate, async (request, response, next) => {
  try {
    const [rows] = await pool.execute('SELECT salon_id AS salonId FROM favorite_salons WHERE user_id = ?', [request.user.sub]);
    return response.json({ data: rows.map((row) => row.salonId) });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/favorite-salons/:salonId', authenticate, async (request, response, next) => {
  try {
    await pool.execute('INSERT IGNORE INTO favorite_salons (user_id, salon_id) VALUES (?, ?)', [request.user.sub, request.params.salonId]);
    return response.json({ data: { salonId: Number(request.params.salonId), favorite: true } });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/favorite-salons/:salonId', authenticate, async (request, response, next) => {
  try {
    await pool.execute('DELETE FROM favorite_salons WHERE user_id = ? AND salon_id = ?', [request.user.sub, request.params.salonId]);
    return response.json({ data: { salonId: Number(request.params.salonId), favorite: false } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/privacy-settings', authenticate, async (request, response, next) => {
  try {
    await pool.execute('INSERT IGNORE INTO privacy_settings (user_id) VALUES (?)', [request.user.sub]);
    const [rows] = await pool.execute(
      'SELECT notifications_enabled AS notificationsEnabled, save_scan_history AS saveScanHistory FROM privacy_settings WHERE user_id = ?',
      [request.user.sub],
    );
    return response.json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/privacy-settings', authenticate, async (request, response, next) => {
  const notificationsEnabled = Boolean(request.body.notificationsEnabled);
  const saveScanHistory = Boolean(request.body.saveScanHistory);
  try {
    await pool.execute(
      `INSERT INTO privacy_settings (user_id, notifications_enabled, save_scan_history) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE notifications_enabled = VALUES(notifications_enabled), save_scan_history = VALUES(save_scan_history)`,
      [request.user.sub, notificationsEnabled, saveScanHistory],
    );
    return response.json({ data: { notificationsEnabled, saveScanHistory } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/salons', async (request, response, next) => {
  try {
    const search = String(request.query.search || '').trim();
    const pattern = `%${search}%`;
    const [salons] = await pool.execute(
      `SELECT id, name, description, address, city, latitude, longitude,
              phone, website, source, source_url, rating, opening_time, closing_time
       FROM salons
       WHERE is_active = TRUE AND (? = '' OR name LIKE ? OR city LIKE ?)
       ORDER BY rating DESC, name ASC`,
      [search, pattern, pattern],
    );
    response.json({ data: salons });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/services', async (request, response, next) => {
  try {
    const [services] = await pool.execute(
      `SELECT id, salon_id, name, description, price, duration_minutes
       FROM services WHERE salon_id = ? AND is_active = TRUE ORDER BY name`,
      [request.params.salonId],
    );
    response.json({ data: services });
  } catch (error) {
    next(error);
  }
});

app.get('/api/bookings', authenticate, async (request, response, next) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.id, b.appointment_at AS appointmentAt, b.status, b.notes,
              sv.id AS serviceId, sv.name AS serviceName, sv.price,
              sv.duration_minutes AS durationMinutes,
              sa.id AS salonId, sa.name AS salonName,
              u.full_name AS stylistName
       FROM bookings b
       JOIN services sv ON sv.id = b.service_id
       JOIN salons sa ON sa.id = sv.salon_id
       LEFT JOIN stylists st ON st.id = b.stylist_id
       LEFT JOIN users u ON u.id = st.user_id
       WHERE b.user_id = ?
       ORDER BY b.appointment_at DESC`,
      [request.user.sub],
    );
    response.json({ data: bookings });
  } catch (error) {
    next(error);
  }
});

app.post('/api/bookings', authenticate, async (request, response, next) => {
  const { serviceId, stylistId = null, appointmentAt, notes = null } = request.body;
  if (!serviceId || !appointmentAt) {
    return response.status(400).json({ error: 'serviceId and appointmentAt are required.' });
  }
  const appointmentDate = new Date(String(appointmentAt).replace(' ', 'T'));
  if (Number.isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
    return response.status(400).json({ error: 'Choose an appointment date and time in the future.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO bookings (user_id, service_id, stylist_id, appointment_at, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [request.user.sub, serviceId, stylistId, appointmentAt, notes],
    );
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Booking submitted', 'Your appointment request is waiting for salon confirmation.')`,
      [request.user.sub],
    );
    return response.status(201).json({ data: { id: result.insertId, status: 'pending' } });
  } catch (error) {
    return next(error);
  }
});

app.use((_request, response) => response.status(404).json({ error: 'Route not found.' }));

app.use((error, _request, response, _next) => {
  console.error(error);
  const isDatabaseInputError = ['ER_NO_REFERENCED_ROW_2', 'ER_DUP_ENTRY'].includes(error.code);
  response.status(isDatabaseInputError ? 409 : 500).json({
    error: isDatabaseInputError ? 'The booking conflicts with existing data.' : 'Internal server error.',
  });
});

module.exports = app;
