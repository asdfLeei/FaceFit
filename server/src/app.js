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
