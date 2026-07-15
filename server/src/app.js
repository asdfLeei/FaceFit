const cors = require('cors');
const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }));
app.use(express.json({ limit: '5mb' }));

const reviewUploadsDirectory = path.join(__dirname, '..', 'uploads', 'reviews');
fs.mkdir(reviewUploadsDirectory, { recursive: true }).catch((error) => console.error('Could not create review upload directory:', error));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

async function removeReviewImage(imagePath) {
  if (!imagePath?.startsWith('/uploads/reviews/')) return;
  await fs.unlink(path.join(reviewUploadsDirectory, path.basename(imagePath))).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

async function storeReviewImage(imageData, userId, salonId) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
  if (!match) throw Object.assign(new Error('Review photos must be JPG, PNG, or WebP.'), { status: 400 });
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 2.5 * 1024 * 1024) {
    throw Object.assign(new Error('Review photos must be smaller than 2.5 MB.'), { status: 400 });
  }
  const validSignature = extension === 'jpg'
    ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : extension === 'png'
      ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (!validSignature) throw Object.assign(new Error('The selected review photo is not a valid image.'), { status: 400 });

  const filename = `review-${userId}-${salonId}-${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(reviewUploadsDirectory, filename), buffer);
  return `/uploads/reviews/${filename}`;
}

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

app.get('/api/owner/dashboard', authenticate, async (request, response, next) => {
  if (request.user.role !== 'owner') return response.status(403).json({ error: 'Salon owner access is required.' });
  try {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.address, s.phone,
              COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.salon_id = s.id), 0) AS rating,
              (SELECT COUNT(*) FROM reviews r WHERE r.salon_id = s.id) AS reviewCount,
              (SELECT COUNT(*) FROM services sv WHERE sv.salon_id = s.id AND sv.is_active = TRUE) AS serviceCount,
              (SELECT COUNT(*) FROM stylists st WHERE st.salon_id = s.id AND st.is_available = TRUE) AS availableStaff,
              (SELECT COUNT(*) FROM bookings b JOIN services sv ON sv.id = b.service_id
               WHERE sv.salon_id = s.id AND DATE(b.appointment_at) = CURRENT_DATE
                 AND b.status <> 'cancelled') AS todayBookings,
              (SELECT COUNT(*) FROM bookings b JOIN services sv ON sv.id = b.service_id
               WHERE sv.salon_id = s.id AND b.status = 'pending') AS pendingBookings
       FROM salons s WHERE s.owner_id = ? LIMIT 1`,
      [request.user.sub],
    );
    if (!rows[0]) return response.status(404).json({ error: 'No salon is linked to this owner account.' });
    return response.json({ data: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/owner/management', authenticate, async (request, response, next) => {
  if (request.user.role !== 'owner') return response.status(403).json({ error: 'Salon owner access is required.' });
  try {
    const [salons] = await pool.execute(
      `SELECT id, name, description, address, city, phone, website, rating,
              opening_time AS openingTime, closing_time AS closingTime, is_active AS isActive
       FROM salons WHERE owner_id = ? LIMIT 1`,
      [request.user.sub],
    );
    const salon = salons[0];
    if (!salon) return response.status(404).json({ error: 'No salon is linked to this owner account.' });

    const [services] = await pool.execute(
      `SELECT id, salon_id, name, description, price, duration_minutes, is_active AS isActive
       FROM services WHERE salon_id = ? ORDER BY is_active DESC, name`,
      [salon.id],
    );
    const [staff] = await pool.execute(
      `SELECT st.id, u.full_name AS name, u.email, u.phone, st.specialties,
              st.is_available AS isAvailable
       FROM stylists st JOIN users u ON u.id = st.user_id
       WHERE st.salon_id = ? ORDER BY st.is_available DESC, u.full_name`,
      [salon.id],
    );
    const [bookings] = await pool.execute(
      `SELECT b.id, b.appointment_at AS appointmentAt, b.status, b.notes,
              sv.name AS serviceName, sv.price, sv.duration_minutes AS durationMinutes,
              customer.full_name AS customerName, customer.email AS customerEmail,
              customer.phone AS customerPhone, stylist.full_name AS stylistName
       FROM bookings b
       JOIN services sv ON sv.id = b.service_id
       JOIN users customer ON customer.id = b.user_id
       LEFT JOIN stylists st ON st.id = b.stylist_id
       LEFT JOIN users stylist ON stylist.id = st.user_id
       WHERE sv.salon_id = ?
       ORDER BY FIELD(b.status, 'pending', 'confirmed', 'completed', 'cancelled'), b.appointment_at DESC`,
      [salon.id],
    );
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.comment, r.image_path AS imageUrl, r.created_at AS createdAt,
              u.full_name AS reviewerName
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.salon_id = ? ORDER BY r.created_at DESC`,
      [salon.id],
    );

    return response.json({ data: { salon, services, staff, bookings, reviews } });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/owner/bookings/:bookingId', authenticate, async (request, response, next) => {
  if (request.user.role !== 'owner') return response.status(403).json({ error: 'Salon owner access is required.' });
  const bookingId = Number(request.params.bookingId);
  const status = String(request.body.status || '');
  if (!Number.isInteger(bookingId) || !['confirmed', 'completed', 'cancelled'].includes(status)) {
    return response.status(400).json({ error: 'Choose a valid booking status.' });
  }
  try {
    const [bookings] = await pool.execute(
      `SELECT b.id, b.user_id AS userId, s.name AS salonName
       FROM bookings b JOIN services sv ON sv.id = b.service_id
       JOIN salons s ON s.id = sv.salon_id
       WHERE b.id = ? AND s.owner_id = ? LIMIT 1`,
      [bookingId, request.user.sub],
    );
    const booking = bookings[0];
    if (!booking) return response.status(404).json({ error: 'Booking not found for this salon.' });
    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [booking.userId, `Booking ${status}`, `${booking.salonName} marked your appointment as ${status}.`],
    );
    return response.json({ data: { id: bookingId, status } });
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

app.get('/api/salons/:salonId/staff', async (request, response, next) => {
  try {
    const [staff] = await pool.execute(
      `SELECT st.id, u.full_name AS name, st.specialties, st.is_available AS isAvailable
       FROM stylists st
       JOIN users u ON u.id = st.user_id
       WHERE st.salon_id = ? AND st.is_available = TRUE
       ORDER BY u.full_name`,
      [request.params.salonId],
    );
    response.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/reviews', async (request, response, next) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.comment, r.image_path AS imageUrl, r.created_at AS createdAt,
              u.full_name AS reviewerName
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.salon_id = ?
       ORDER BY r.created_at DESC`,
      [request.params.salonId],
    );
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count : 0;
    response.json({ data: { reviews, summary: { count, average: Number(average.toFixed(1)) } } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/my-reviews', authenticate, async (request, response, next) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT id, rating, comment, image_path AS imageUrl, created_at AS createdAt
       FROM reviews WHERE salon_id = ? AND user_id = ? ORDER BY created_at DESC`,
      [request.params.salonId, request.user.sub],
    );
    response.json({ data: reviews });
  } catch (error) {
    next(error);
  }
});

async function updateSalonReviewSummary(salonId) {
  const [[summary]] = await pool.execute(
    'SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average FROM reviews WHERE salon_id = ?',
    [salonId],
  );
  await pool.execute('UPDATE salons SET rating = ? WHERE id = ?', [Number(summary.average), salonId]);
  return { count: Number(summary.count), average: Number(Number(summary.average).toFixed(1)) };
}

app.post('/api/salons/:salonId/reviews', authenticate, async (request, response, next) => {
  const salonId = Number(request.params.salonId);
  const rating = Number(request.body.rating);
  const comment = String(request.body.comment || '').trim().slice(0, 500) || null;
  const imageData = request.body.imageData;
  if (!Number.isInteger(salonId) || salonId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return response.status(400).json({ error: 'Choose a rating from 1 to 5.' });
  }

  try {
    const [salons] = await pool.execute('SELECT id FROM salons WHERE id = ? AND is_active = TRUE', [salonId]);
    if (!salons.length) return response.status(404).json({ error: 'Salon not found.' });

    let imagePath = null;
    if (typeof imageData === 'string') imagePath = await storeReviewImage(imageData, request.user.sub, salonId);
    const [result] = await pool.execute(
      'INSERT INTO reviews (user_id, salon_id, rating, comment, image_path) VALUES (?, ?, ?, ?, ?)',
      [request.user.sub, salonId, rating, comment, imagePath],
    );
    const summary = await updateSalonReviewSummary(salonId);
    return response.status(201).json({ data: { id: result.insertId, rating, comment, imageUrl: imagePath, summary } });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/reviews/:reviewId', authenticate, async (request, response, next) => {
  const reviewId = Number(request.params.reviewId);
  const rating = Number(request.body.rating);
  const comment = String(request.body.comment || '').trim().slice(0, 500) || null;
  const imageData = request.body.imageData;
  if (!Number.isInteger(reviewId) || reviewId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return response.status(400).json({ error: 'Choose a rating from 1 to 5.' });
  }

  try {
    const [reviews] = await pool.execute(
      'SELECT salon_id AS salonId, image_path AS imagePath FROM reviews WHERE id = ? AND user_id = ? LIMIT 1',
      [reviewId, request.user.sub],
    );
    if (!reviews.length) return response.status(404).json({ error: 'Review not found or cannot be edited.' });
    const { salonId, imagePath: previousImagePath } = reviews[0];
    let imagePath = previousImagePath;
    if (typeof imageData === 'string') imagePath = await storeReviewImage(imageData, request.user.sub, salonId);
    else if (imageData === null) imagePath = null;

    await pool.execute(
      'UPDATE reviews SET rating = ?, comment = ?, image_path = ?, created_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [rating, comment, imagePath, reviewId, request.user.sub],
    );
    if (previousImagePath && previousImagePath !== imagePath) await removeReviewImage(previousImagePath);
    const summary = await updateSalonReviewSummary(salonId);
    return response.json({ data: { id: reviewId, rating, comment, imageUrl: imagePath, summary } });
  } catch (error) {
    return next(error);
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
    if (stylistId) {
      const [availableStaff] = await pool.execute(
        `SELECT st.id FROM stylists st
         JOIN services sv ON sv.salon_id = st.salon_id
         WHERE st.id = ? AND sv.id = ? AND st.is_available = TRUE`,
        [stylistId, serviceId],
      );
      if (!availableStaff.length) {
        return response.status(400).json({ error: 'The selected staff member is not available for this salon.' });
      }
    }
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
  response.status(error.status || (isDatabaseInputError ? 409 : 500)).json({
    error: error.status ? error.message : isDatabaseInputError ? 'The booking conflicts with existing data.' : 'Internal server error.',
  });
});

module.exports = app;
