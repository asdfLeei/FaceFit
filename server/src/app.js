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
const managedUploadDirectories = {
  portfolio: path.join(__dirname, '..', 'uploads', 'portfolio'),
  salon: path.join(__dirname, '..', 'uploads', 'salon'),
  staff: path.join(__dirname, '..', 'uploads', 'staff'),
  replies: path.join(__dirname, '..', 'uploads', 'replies'),
  profile: path.join(__dirname, '..', 'uploads', 'profile'),
};
Promise.all([reviewUploadsDirectory, ...Object.values(managedUploadDirectories)].map(directory => fs.mkdir(directory, { recursive: true })))
  .catch((error) => console.error('Could not create upload directories:', error));
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

async function storeManagedImage(imageData, category, ownerId, subjectId) {
  const directory = managedUploadDirectories[category];
  if (!directory) throw Object.assign(new Error('Unsupported image category.'), { status: 400 });
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
  if (!match) throw Object.assign(new Error('Photos must be JPG, PNG, or WebP.'), { status: 400 });
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 2.5 * 1024 * 1024) throw Object.assign(new Error('Photos must be smaller than 2.5 MB.'), { status: 400 });
  const validSignature = extension === 'jpg'
    ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : extension === 'png'
      ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (!validSignature) throw Object.assign(new Error('The selected file is not a valid image.'), { status: 400 });
  const filename = `${category}-${ownerId}-${subjectId}-${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(directory, filename), buffer);
  return `/uploads/${category}/${filename}`;
}

async function removeManagedImage(imagePath, category) {
  if (!imagePath?.startsWith(`/uploads/${category}/`)) return;
  await fs.unlink(path.join(managedUploadDirectories[category], path.basename(imagePath))).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
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

async function getOwnerSalon(ownerId) {
  const [rows] = await pool.execute('SELECT id, name, profile_image_path AS profileImageUrl FROM salons WHERE owner_id = ? LIMIT 1', [ownerId]);
  if (!rows[0]) throw Object.assign(new Error('No salon is linked to this owner account.'), { status: 404 });
  return rows[0];
}

function requireOwner(request, response) {
  if (request.user.role === 'owner') return true;
  response.status(403).json({ error: 'Salon owner access is required.' });
  return false;
}

function optionalText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength) || null;
}

app.post('/api/face-analysis', authenticate, async (request, response, next) => {
  const { imageData } = request.body;
  if (typeof imageData !== 'string' || imageData.length > 5.5 * 1024 * 1024) {
    return response.status(400).json({ error: 'A face photo smaller than 4 MB is required.' });
  }
  const analysisUrl = (process.env.FACE_ANALYSIS_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  try {
    const [profiles] = await pool.execute(
      'SELECT hair_type AS hairType, hair_length AS hairLength, hair_texture AS hairTexture FROM customer_profiles WHERE user_id = ? LIMIT 1',
      [request.user.sub],
    );
    const aiResponse = await fetch(`${analysisUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, stylePreference: 'men', ...(profiles[0] || {}) }),
      signal: AbortSignal.timeout(30000),
    });
    const analysis = await aiResponse.json().catch(() => null);
    if (!aiResponse.ok) {
      return response.status(aiResponse.status === 422 ? 422 : 502).json({
        error: analysis?.detail || 'Face analysis could not process this photo.',
      });
    }
    const [privacyRows] = await pool.execute(
      'SELECT save_scan_history AS saveScanHistory FROM privacy_settings WHERE user_id = ? LIMIT 1',
      [request.user.sub],
    );
    if (privacyRows[0]?.saveScanHistory !== 0) {
      await pool.execute(
        'INSERT INTO face_analyses (user_id, face_shape, confidence) VALUES (?, ?, ?)',
        [request.user.sub, analysis.faceShape, Number(analysis.confidence) * 100],
      );
    }
    return response.json({ data: analysis });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.cause?.code === 'ECONNREFUSED') {
      return response.status(503).json({ error: 'The face-analysis service is unavailable. Start the Python service and try again.' });
    }
    return next(error);
  }
});

async function attachReviewReplies(reviews, salonId) {
  const [replies] = await pool.execute(
    `SELECT rr.id, rr.review_id AS reviewId, rr.message, rr.image_path AS imageUrl,
            rr.created_at AS createdAt, s.name AS salonName
     FROM review_replies rr
     JOIN reviews r ON r.id = rr.review_id
     JOIN salons s ON s.id = r.salon_id
     WHERE r.salon_id = ? ORDER BY rr.created_at ASC, rr.id ASC`,
    [salonId],
  );
  const grouped = new Map();
  for (const reply of replies) {
    const list = grouped.get(reply.reviewId) || [];
    list.push(reply);
    grouped.set(reply.reviewId, list);
  }
  return reviews.map(review => ({ ...review, replies: grouped.get(review.id) || [] }));
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
  const salonName = String(request.body.salonName || '').trim();
  const salonAddress = String(request.body.salonAddress || '').trim();
  const salonCity = String(request.body.salonCity || '').trim();
  const latitude = Number(request.body.latitude);
  const longitude = Number(request.body.longitude);
  const salonLogoData = request.body.salonLogoData;

  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return response.status(400).json({ error: 'Enter a valid name, email, and password of at least 8 characters.' });
  }
  if (role === 'owner' && (salonName.length < 2 || salonAddress.length < 5 || salonCity.length < 2 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return response.status(400).json({ error: 'Enter your salon name, address, city, and a valid map location.' });
  }

  const connection = await pool.getConnection();
  let storedLogo = null;
  try {
    await connection.beginTransaction();
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, phone, role],
    );
    if (role === 'owner') {
      const [salonResult] = await connection.execute(
        `INSERT INTO salons (owner_id, name, address, city, latitude, longitude, phone, source, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'owner-registration', TRUE)`,
        [result.insertId, salonName, salonAddress, salonCity, latitude, longitude, phone],
      );
      if (typeof salonLogoData === 'string') {
        storedLogo = await storeManagedImage(salonLogoData, 'salon', result.insertId, salonResult.insertId);
        await connection.execute('UPDATE salons SET profile_image_path = ? WHERE id = ?', [storedLogo, salonResult.insertId]);
      }
    }
    await connection.commit();
    const user = { id: result.insertId, full_name: fullName, email, phone, role };
    return response.status(201).json({ data: { user: publicUser(user), token: createToken(user) } });
  } catch (error) {
    await connection.rollback();
    if (storedLogo) await removeManagedImage(storedLogo, 'salon').catch(() => {});
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'An account with this email already exists.' });
    return next(error);
  } finally {
    connection.release();
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
              u.created_at AS createdAt, u.profile_image_path AS profileImageUrl,
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

app.patch('/api/profile', authenticate, async (request, response, next) => {
  const fullName = String(request.body.fullName || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const phone = optionalText(request.body.phone, 30);
  const hairType = optionalText(request.body.hairType, 50);
  const hairLength = optionalText(request.body.hairLength, 50);
  const hairTexture = optionalText(request.body.hairTexture, 50);
  const imageData = request.body.imageData;
  if (fullName.length < 2 || fullName.length > 120 || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'Enter a valid name and email address.' });
  }
  let nextImagePath;
  let previousImagePath;
  try {
    const [users] = await pool.execute('SELECT profile_image_path AS profileImageUrl FROM users WHERE id = ? LIMIT 1', [request.user.sub]);
    if (!users[0]) return response.status(404).json({ error: 'Profile not found.' });
    previousImagePath = users[0].profileImageUrl;
    nextImagePath = previousImagePath;
    if (typeof imageData === 'string') nextImagePath = await storeManagedImage(imageData, 'profile', request.user.sub, request.user.sub);
    else if (imageData === null) nextImagePath = null;

    await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, profile_image_path = ? WHERE id = ?',
      [fullName, email, phone, nextImagePath, request.user.sub],
    );
    await pool.execute(
      `INSERT INTO customer_profiles (user_id, hair_type, hair_length, hair_texture) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE hair_type = VALUES(hair_type), hair_length = VALUES(hair_length), hair_texture = VALUES(hair_texture)`,
      [request.user.sub, hairType, hairLength, hairTexture],
    );
    if (previousImagePath && previousImagePath !== nextImagePath) await removeManagedImage(previousImagePath, 'profile');
    const [updated] = await pool.execute(
      `SELECT u.id, u.full_name AS fullName, u.email, u.phone, u.role, u.created_at AS createdAt,
              u.profile_image_path AS profileImageUrl, cp.hair_type AS hairType,
              cp.hair_length AS hairLength, cp.hair_texture AS hairTexture,
              (SELECT fa.face_shape FROM face_analyses fa WHERE fa.user_id = u.id ORDER BY fa.created_at DESC, fa.id DESC LIMIT 1) AS faceShape
       FROM users u LEFT JOIN customer_profiles cp ON cp.user_id = u.id WHERE u.id = ? LIMIT 1`,
      [request.user.sub],
    );
    return response.json({ data: updated[0] });
  } catch (error) {
    if (nextImagePath && nextImagePath !== previousImagePath) await removeManagedImage(nextImagePath, 'profile').catch(() => {});
    return next(error);
  }
});

app.get('/api/owner/dashboard', authenticate, async (request, response, next) => {
  if (request.user.role !== 'owner') return response.status(403).json({ error: 'Salon owner access is required.' });
  response.set('Cache-Control', 'no-store');
  try {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.address, s.phone, s.profile_image_path AS profileImageUrl,
              COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.salon_id = s.id), 0) AS rating,
              (SELECT COUNT(*) FROM reviews r WHERE r.salon_id = s.id) AS reviewCount,
              (SELECT COUNT(*) FROM services sv WHERE sv.salon_id = s.id AND sv.is_active = TRUE AND sv.deleted_at IS NULL) AS serviceCount,
              (SELECT COUNT(*) FROM stylists st WHERE st.salon_id = s.id AND st.is_available = TRUE AND st.deleted_at IS NULL) AS availableStaff,
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

app.post('/api/owner/salon', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const name = String(request.body.name || '').trim();
  const address = String(request.body.address || '').trim();
  const city = String(request.body.city || '').trim();
  const latitude = Number(request.body.latitude);
  const longitude = Number(request.body.longitude);
  const logoData = request.body.logoData;
  if (name.length < 2 || address.length < 5 || city.length < 2 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return response.status(400).json({ error: 'Enter your salon name, address, city, and a valid map location.' });
  }
  let logoPath = null;
  try {
    const [existing] = await pool.execute('SELECT id FROM salons WHERE owner_id = ? LIMIT 1', [request.user.sub]);
    if (existing[0]) return response.status(409).json({ error: 'This owner already has a salon.' });
    const [unclaimed] = await pool.execute('SELECT id FROM salons WHERE owner_id IS NULL AND LOWER(name) = LOWER(?) LIMIT 1', [name]);
    let salonId = unclaimed[0]?.id;
    if (salonId) {
      await pool.execute(
        `UPDATE salons SET owner_id = ?, address = ?, city = ?, latitude = ?, longitude = ?,
                source = 'owner-registration', is_active = TRUE WHERE id = ?`,
        [request.user.sub, address, city, latitude, longitude, salonId],
      );
    } else {
      const [result] = await pool.execute(
        `INSERT INTO salons (owner_id, name, address, city, latitude, longitude, source, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'owner-registration', TRUE)`,
        [request.user.sub, name, address, city, latitude, longitude],
      );
      salonId = result.insertId;
    }
    if (typeof logoData === 'string') {
      logoPath = await storeManagedImage(logoData, 'salon', request.user.sub, salonId);
      await pool.execute('UPDATE salons SET profile_image_path = ? WHERE id = ?', [logoPath, salonId]);
    }
    return response.status(201).json({ data: { id: salonId, name, address, city, latitude, longitude, profileImageUrl: logoPath } });
  } catch (error) {
    if (logoPath) await removeManagedImage(logoPath, 'salon').catch(() => {});
    return next(error);
  }
});

app.get('/api/owner/management', authenticate, async (request, response, next) => {
  if (request.user.role !== 'owner') return response.status(403).json({ error: 'Salon owner access is required.' });
  try {
    const [salons] = await pool.execute(
      `SELECT id, name, description, address, city, phone, website,
              profile_image_path AS profileImageUrl, rating,
              opening_time AS openingTime, closing_time AS closingTime, is_active AS isActive
       FROM salons WHERE owner_id = ? LIMIT 1`,
      [request.user.sub],
    );
    const salon = salons[0];
    if (!salon) return response.status(404).json({ error: 'No salon is linked to this owner account.' });

    const [services] = await pool.execute(
      `SELECT id, salon_id, name, description, price, duration_minutes, is_active AS isActive
       FROM services WHERE salon_id = ? AND deleted_at IS NULL ORDER BY is_active DESC, name`,
      [salon.id],
    );
    const [staff] = await pool.execute(
      `SELECT st.id, u.full_name AS name, u.email, u.phone, st.specialties,
              st.is_available AS isAvailable, st.image_path AS imageUrl
       FROM stylists st JOIN users u ON u.id = st.user_id
       WHERE st.salon_id = ? AND st.deleted_at IS NULL ORDER BY st.is_available DESC, u.full_name`,
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
              r.owner_reply AS ownerReply, r.owner_replied_at AS ownerRepliedAt,
              u.full_name AS reviewerName
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.salon_id = ? ORDER BY r.created_at DESC`,
      [salon.id],
    );
    const [portfolioImages] = await pool.execute(
      `SELECT id, image_path AS imageUrl, caption, created_at AS createdAt
       FROM salon_portfolio_images WHERE salon_id = ? ORDER BY created_at DESC, id DESC`,
      [salon.id],
    );
    const reviewsWithReplies = await attachReviewReplies(reviews, salon.id);

    return response.json({ data: { salon, services, staff, bookings, reviews: reviewsWithReplies, portfolioImages } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/owner/services', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const name = String(request.body.name || '').trim();
  const description = optionalText(request.body.description, 1000);
  const price = Number(request.body.price);
  const durationMinutes = Number(request.body.durationMinutes);
  if (name.length < 2 || name.length > 150 || !Number.isFinite(price) || price < 0 || price > 999999.99 || !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440) {
    return response.status(400).json({ error: 'Enter a service name, a valid price, and a duration from 5 to 1440 minutes.' });
  }
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [result] = await pool.execute(
      'INSERT INTO services (salon_id, name, description, price, duration_minutes) VALUES (?, ?, ?, ?, ?)',
      [salon.id, name, description, price, durationMinutes],
    );
    return response.status(201).json({ data: { id: result.insertId, salon_id: salon.id, name, description, price, duration_minutes: durationMinutes, isActive: true } });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/owner/services/:serviceId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const serviceId = Number(request.params.serviceId);
  const name = String(request.body.name || '').trim();
  const description = optionalText(request.body.description, 1000);
  const price = Number(request.body.price);
  const durationMinutes = Number(request.body.durationMinutes);
  const isActive = request.body.isActive !== false;
  if (!Number.isInteger(serviceId) || name.length < 2 || name.length > 150 || !Number.isFinite(price) || price < 0 || price > 999999.99 || !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440) {
    return response.status(400).json({ error: 'Enter a service name, a valid price, and a duration from 5 to 1440 minutes.' });
  }
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [result] = await pool.execute(
      `UPDATE services SET name = ?, description = ?, price = ?, duration_minutes = ?, is_active = ?
       WHERE id = ? AND salon_id = ? AND deleted_at IS NULL`,
      [name, description, price, durationMinutes, isActive, serviceId, salon.id],
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Service not found for this salon.' });
    return response.json({ data: { id: serviceId, salon_id: salon.id, name, description, price, duration_minutes: durationMinutes, isActive } });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/owner/services/:serviceId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const serviceId = Number(request.params.serviceId);
  if (!Number.isInteger(serviceId)) return response.status(400).json({ error: 'Choose a valid service.' });
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [result] = await pool.execute(
      'UPDATE services SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE WHERE id = ? AND salon_id = ? AND deleted_at IS NULL',
      [serviceId, salon.id],
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Service not found for this salon.' });
    return response.json({ data: { id: serviceId, removed: true } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/owner/staff', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const name = String(request.body.name || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const phone = optionalText(request.body.phone, 30);
  const specialties = optionalText(request.body.specialties, 255);
  const password = String(request.body.password || '');
  const imageData = request.body.imageData;
  if (name.length < 2 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return response.status(400).json({ error: 'Enter a valid name, email, and temporary password of at least 8 characters.' });
  }
  let connection;
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const passwordHash = await bcrypt.hash(password, 12);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'stylist')`,
      [name, email, passwordHash, phone],
    );
    const [stylistResult] = await connection.execute(
      'INSERT INTO stylists (user_id, salon_id, specialties, is_available) VALUES (?, ?, ?, TRUE)',
      [userResult.insertId, salon.id, specialties],
    );
    let imagePath = null;
    if (typeof imageData === 'string') {
      imagePath = await storeManagedImage(imageData, 'staff', request.user.sub, stylistResult.insertId);
      await connection.execute('UPDATE stylists SET image_path = ? WHERE id = ?', [imagePath, stylistResult.insertId]);
    }
    await connection.commit();
    return response.status(201).json({ data: { id: stylistResult.insertId, name, email, phone, specialties, isAvailable: true, imageUrl: imagePath } });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'A staff account with this email already exists.' });
    return next(error);
  } finally {
    connection?.release();
  }
});

app.put('/api/owner/staff/:staffId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const staffId = Number(request.params.staffId);
  const name = String(request.body.name || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const phone = optionalText(request.body.phone, 30);
  const specialties = optionalText(request.body.specialties, 255);
  const password = String(request.body.password || '');
  const isAvailable = request.body.isAvailable !== false;
  const imageData = request.body.imageData;
  if (!Number.isInteger(staffId) || name.length < 2 || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || (password && password.length < 8)) {
    return response.status(400).json({ error: 'Enter a valid staff name and email. New passwords must have at least 8 characters.' });
  }
  let connection;
  try {
    const salon = await getOwnerSalon(request.user.sub);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [staffRows] = await connection.execute(
      'SELECT user_id AS userId, image_path AS imagePath FROM stylists WHERE id = ? AND salon_id = ? AND deleted_at IS NULL LIMIT 1',
      [staffId, salon.id],
    );
    if (!staffRows[0]) {
      await connection.rollback();
      return response.status(404).json({ error: 'Staff member not found for this salon.' });
    }
    const passwordSql = password ? ', password_hash = ?' : '';
    const userValues = password ? [name, email, phone, await bcrypt.hash(password, 12), staffRows[0].userId] : [name, email, phone, staffRows[0].userId];
    await connection.execute(`UPDATE users SET full_name = ?, email = ?, phone = ?${passwordSql} WHERE id = ?`, userValues);
    let imagePath = staffRows[0].imagePath;
    if (typeof imageData === 'string') imagePath = await storeManagedImage(imageData, 'staff', request.user.sub, staffId);
    else if (imageData === null) imagePath = null;
    await connection.execute('UPDATE stylists SET specialties = ?, is_available = ?, image_path = ? WHERE id = ?', [specialties, isAvailable, imagePath, staffId]);
    await connection.commit();
    if (staffRows[0].imagePath && staffRows[0].imagePath !== imagePath) await removeManagedImage(staffRows[0].imagePath, 'staff');
    return response.json({ data: { id: staffId, name, email, phone, specialties, isAvailable, imageUrl: imagePath } });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'A staff account with this email already exists.' });
    return next(error);
  } finally {
    connection?.release();
  }
});

app.delete('/api/owner/staff/:staffId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const staffId = Number(request.params.staffId);
  if (!Number.isInteger(staffId)) return response.status(400).json({ error: 'Choose a valid staff member.' });
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [staffRows] = await pool.execute('SELECT image_path AS imagePath FROM stylists WHERE id = ? AND salon_id = ? AND deleted_at IS NULL LIMIT 1', [staffId, salon.id]);
    const [result] = await pool.execute(
      'UPDATE stylists SET deleted_at = CURRENT_TIMESTAMP, is_available = FALSE WHERE id = ? AND salon_id = ? AND deleted_at IS NULL',
      [staffId, salon.id],
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Staff member not found for this salon.' });
    if (staffRows[0]?.imagePath) await removeManagedImage(staffRows[0].imagePath, 'staff');
    return response.json({ data: { id: staffId, removed: true } });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/owner/profile', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const name = String(request.body.name || '').trim();
  const description = optionalText(request.body.description, 2000);
  const address = String(request.body.address || '').trim();
  const city = String(request.body.city || '').trim();
  const phone = optionalText(request.body.phone, 30);
  const website = optionalText(request.body.website, 500);
  const openingTime = optionalText(request.body.openingTime, 8);
  const closingTime = optionalText(request.body.closingTime, 8);
  const imageData = request.body.imageData;
  const validTime = (value) => !value || /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
  if (name.length < 2 || name.length > 150 || !address || !city || !validTime(openingTime) || !validTime(closingTime)) {
    return response.status(400).json({ error: 'Enter a salon name, address, city, and valid opening and closing times (HH:MM).' });
  }
  try {
    const salon = await getOwnerSalon(request.user.sub);
    let profileImageUrl = salon.profileImageUrl;
    if (typeof imageData === 'string') profileImageUrl = await storeManagedImage(imageData, 'salon', request.user.sub, salon.id);
    else if (imageData === null) profileImageUrl = null;
    await pool.execute(
      `UPDATE salons SET name = ?, description = ?, address = ?, city = ?, phone = ?, website = ?,
              profile_image_path = ?, opening_time = ?, closing_time = ? WHERE id = ?`,
      [name, description, address, city, phone, website, profileImageUrl, openingTime, closingTime, salon.id],
    );
    if (salon.profileImageUrl && salon.profileImageUrl !== profileImageUrl) await removeManagedImage(salon.profileImageUrl, 'salon');
    return response.json({ data: { id: salon.id, name, description, address, city, phone, website, profileImageUrl, openingTime, closingTime } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/owner/portfolio-images', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const imageData = request.body.imageData;
  const caption = optionalText(request.body.caption, 200);
  if (typeof imageData !== 'string') return response.status(400).json({ error: 'Choose a portfolio photo to upload.' });
  let imagePath;
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [[count]] = await pool.execute('SELECT COUNT(*) AS total FROM salon_portfolio_images WHERE salon_id = ?', [salon.id]);
    if (Number(count.total) >= 12) return response.status(400).json({ error: 'A business portfolio can contain up to 12 photos.' });
    imagePath = await storeManagedImage(imageData, 'portfolio', request.user.sub, salon.id);
    const [result] = await pool.execute(
      'INSERT INTO salon_portfolio_images (salon_id, image_path, caption) VALUES (?, ?, ?)',
      [salon.id, imagePath, caption],
    );
    return response.status(201).json({ data: { id: result.insertId, imageUrl: imagePath, caption, createdAt: new Date().toISOString() } });
  } catch (error) {
    if (imagePath) await removeManagedImage(imagePath, 'portfolio').catch(() => {});
    return next(error);
  }
});

app.delete('/api/owner/portfolio-images/:imageId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const imageId = Number(request.params.imageId);
  if (!Number.isInteger(imageId)) return response.status(400).json({ error: 'Choose a valid portfolio photo.' });
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [images] = await pool.execute('SELECT image_path AS imagePath FROM salon_portfolio_images WHERE id = ? AND salon_id = ? LIMIT 1', [imageId, salon.id]);
    if (!images[0]) return response.status(404).json({ error: 'Portfolio photo not found for this salon.' });
    await pool.execute('DELETE FROM salon_portfolio_images WHERE id = ? AND salon_id = ?', [imageId, salon.id]);
    await removeManagedImage(images[0].imagePath, 'portfolio');
    return response.json({ data: { id: imageId, removed: true } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/owner/reviews/:reviewId/replies', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const reviewId = Number(request.params.reviewId);
  const message = optionalText(request.body.message, 1000);
  const imageData = request.body.imageData;
  if (!Number.isInteger(reviewId)) return response.status(400).json({ error: 'Choose a valid review.' });
  if (!message && typeof imageData !== 'string') return response.status(400).json({ error: 'Write a reply or attach a photo.' });
  let imagePath;
  try {
    const salon = await getOwnerSalon(request.user.sub);
    const [reviews] = await pool.execute('SELECT id, user_id AS userId FROM reviews WHERE id = ? AND salon_id = ? LIMIT 1', [reviewId, salon.id]);
    if (!reviews[0]) return response.status(404).json({ error: 'Review not found for this salon.' });
    if (typeof imageData === 'string') imagePath = await storeManagedImage(imageData, 'replies', request.user.sub, reviewId);
    const [result] = await pool.execute(
      'INSERT INTO review_replies (review_id, owner_id, message, image_path) VALUES (?, ?, ?, ?)',
      [reviewId, request.user.sub, message, imagePath || null],
    );
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, destination, reference_id) VALUES (?, ?, ?, ?, ?)',
      [reviews[0].userId, 'Salon replied to your review', message ? `${salon.name} replied: ${message.slice(0, 350)}` : `${salon.name} replied with a photo.`, 'reviews', reviewId],
    );
    return response.status(201).json({ data: { id: result.insertId, reviewId, message, imageUrl: imagePath || null, salonName: salon.name, createdAt: new Date().toISOString() } });
  } catch (error) {
    if (imagePath) await removeManagedImage(imagePath, 'replies').catch(() => {});
    return next(error);
  }
});

app.delete('/api/owner/review-replies/:replyId', authenticate, async (request, response, next) => {
  if (!requireOwner(request, response)) return;
  const replyId = Number(request.params.replyId);
  if (!Number.isInteger(replyId)) return response.status(400).json({ error: 'Choose a valid reply.' });
  try {
    const [replies] = await pool.execute(
      `SELECT rr.image_path AS imagePath FROM review_replies rr
       JOIN reviews r ON r.id = rr.review_id JOIN salons s ON s.id = r.salon_id
       WHERE rr.id = ? AND s.owner_id = ? LIMIT 1`,
      [replyId, request.user.sub],
    );
    if (!replies[0]) return response.status(404).json({ error: 'Reply not found for this salon.' });
    await pool.execute('DELETE FROM review_replies WHERE id = ?', [replyId]);
    if (replies[0].imagePath) await removeManagedImage(replies[0].imagePath, 'replies');
    return response.json({ data: { id: replyId, removed: true } });
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
      'INSERT INTO notifications (user_id, title, message, destination, reference_id) VALUES (?, ?, ?, ?, ?)',
      [booking.userId, `Booking ${status}`, `${booking.salonName} marked your appointment as ${status}.`, 'bookings', bookingId],
    );
    return response.json({ data: { id: bookingId, status } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/account/:section', authenticate, async (request, response, next) => {
  const queries = {
    saved: `SELECT id, hairstyle_name AS title, saved_at AS createdAt FROM saved_hairstyles WHERE user_id = ? ORDER BY saved_at DESC`,
    salons: `SELECT fs.id, s.id AS salonId, s.name AS title, s.address AS detail, fs.created_at AS createdAt FROM favorite_salons fs JOIN salons s ON s.id = fs.salon_id WHERE fs.user_id = ? ORDER BY fs.created_at DESC`,
    notifications: `SELECT n.id, n.title, n.message AS detail, n.destination, n.reference_id AS referenceId,
                           CASE WHEN n.destination = 'reviews' THEN r.salon_id ELSE NULL END AS salonId,
                           n.is_read AS isRead, n.created_at AS createdAt
                    FROM notifications n
                    LEFT JOIN reviews r ON n.destination = 'reviews' AND r.id = n.reference_id
                    WHERE n.user_id = ? ORDER BY n.created_at DESC, n.id DESC`,
    reviews: `SELECT r.id, r.salon_id AS salonId, s.name AS title, CONCAT(r.rating, ' / 5', IF(r.comment IS NULL OR r.comment = '', '', CONCAT(' · ', r.comment))) AS detail, r.created_at AS createdAt FROM reviews r JOIN salons s ON s.id = r.salon_id WHERE r.user_id = ? ORDER BY r.created_at DESC`,
  };
  const query = queries[request.params.section];
  if (!query) return response.status(404).json({ error: 'Account section not found.' });
  try {
    const [rows] = await pool.execute(query, [request.user.sub]);
    return response.json({ data: rows });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/notifications/unread-count', authenticate, async (request, response, next) => {
  try {
    const [[row]] = await pool.execute(
      'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [request.user.sub],
    );
    return response.json({ data: { unreadCount: Number(row.unreadCount) } });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/notifications/:notificationId/read', authenticate, async (request, response, next) => {
  const notificationId = Number(request.params.notificationId);
  if (!Number.isInteger(notificationId) || notificationId < 1) return response.status(400).json({ error: 'Choose a valid notification.' });
  try {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, request.user.sub],
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Notification not found.' });
    return response.json({ data: { id: notificationId, isRead: true } });
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
  response.set('Cache-Control', 'no-store');
  try {
    const search = String(request.query.search || '').trim();
    const pattern = `%${search}%`;
    const [salons] = await pool.execute(
      `SELECT id, name, description, address, city, latitude, longitude,
              phone, website, profile_image_path AS profileImageUrl,
              source, source_url, rating, opening_time, closing_time
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
       FROM services WHERE salon_id = ? AND is_active = TRUE AND deleted_at IS NULL ORDER BY name`,
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
      `SELECT st.id, u.full_name AS name, st.specialties, st.is_available AS isAvailable,
              st.image_path AS imageUrl
       FROM stylists st
       JOIN users u ON u.id = st.user_id
       WHERE st.salon_id = ? AND st.is_available = TRUE AND st.deleted_at IS NULL
       ORDER BY u.full_name`,
      [request.params.salonId],
    );
    response.json({ data: staff });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/portfolio', async (request, response, next) => {
  try {
    const [images] = await pool.execute(
      `SELECT pi.id, pi.image_path AS imageUrl, pi.caption, pi.created_at AS createdAt
       FROM salon_portfolio_images pi JOIN salons s ON s.id = pi.salon_id
       WHERE pi.salon_id = ? AND s.is_active = TRUE ORDER BY pi.created_at DESC, pi.id DESC`,
      [request.params.salonId],
    );
    response.json({ data: images });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/reviews', async (request, response, next) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.comment, r.image_path AS imageUrl, r.created_at AS createdAt,
              r.owner_reply AS ownerReply, r.owner_replied_at AS ownerRepliedAt,
              u.full_name AS reviewerName
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.salon_id = ?
       ORDER BY r.created_at DESC`,
      [request.params.salonId],
    );
    const reviewsWithReplies = await attachReviewReplies(reviews, request.params.salonId);
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count : 0;
    response.json({ data: { reviews: reviewsWithReplies, summary: { count, average: Number(average.toFixed(1)) } } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/salons/:salonId/my-reviews', authenticate, async (request, response, next) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT id, rating, comment, image_path AS imageUrl, created_at AS createdAt,
              owner_reply AS ownerReply, owner_replied_at AS ownerRepliedAt
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
    const [salons] = await pool.execute('SELECT id, name, owner_id AS ownerId FROM salons WHERE id = ? AND is_active = TRUE', [salonId]);
    if (!salons.length) return response.status(404).json({ error: 'Salon not found.' });

    let imagePath = null;
    if (typeof imageData === 'string') imagePath = await storeReviewImage(imageData, request.user.sub, salonId);
    const [result] = await pool.execute(
      'INSERT INTO reviews (user_id, salon_id, rating, comment, image_path) VALUES (?, ?, ?, ?, ?)',
      [request.user.sub, salonId, rating, comment, imagePath],
    );
    if (salons[0].ownerId) {
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, destination, reference_id)
         VALUES (?, 'New customer review', ?, 'owner-reviews', ?)`,
        [salons[0].ownerId, `${rating}-star review received for ${salons[0].name}.`, result.insertId],
      );
    }
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
    const [bookingOptions] = await pool.execute(
      `SELECT sv.id, sv.name AS serviceName, s.name AS salonName, s.owner_id AS ownerId,
              u.full_name AS customerName
       FROM services sv JOIN salons s ON s.id = sv.salon_id
       JOIN users u ON u.id = ?
       WHERE sv.id = ? AND sv.is_active = TRUE AND sv.deleted_at IS NULL AND s.is_active = TRUE
       LIMIT 1`,
      [request.user.sub, serviceId],
    );
    const bookingDetails = bookingOptions[0];
    if (!bookingDetails) return response.status(404).json({ error: 'The selected salon service is no longer available.' });
    if (stylistId) {
      const [availableStaff] = await pool.execute(
        `SELECT st.id FROM stylists st
         JOIN services sv ON sv.salon_id = st.salon_id
         WHERE st.id = ? AND sv.id = ? AND st.is_available = TRUE
           AND st.deleted_at IS NULL AND sv.deleted_at IS NULL AND sv.is_active = TRUE`,
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
      `INSERT INTO notifications (user_id, title, message, destination, reference_id)
       VALUES (?, 'Booking submitted', ?, 'bookings', ?)`,
      [request.user.sub, `${bookingDetails.salonName} received your ${bookingDetails.serviceName} appointment request.`, result.insertId],
    );
    if (bookingDetails.ownerId) {
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, destination, reference_id)
         VALUES (?, 'New booking request', ?, 'owner-bookings', ?)`,
        [bookingDetails.ownerId, `${bookingDetails.customerName} requested ${bookingDetails.serviceName}.`, result.insertId],
      );
    }
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
