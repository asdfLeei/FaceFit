CREATE DATABASE IF NOT EXISTS facefit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE facefit;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  profile_image_path VARCHAR(500),
  role ENUM('customer', 'stylist', 'owner', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(500) AFTER phone;

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  hair_type VARCHAR(50),
  hair_length VARCHAR(50),
  hair_texture VARCHAR(50),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT UNSIGNED,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  phone VARCHAR(30),
  website VARCHAR(500),
  profile_image_path VARCHAR(500),
  source VARCHAR(50),
  external_id VARCHAR(100),
  source_url VARCHAR(500),
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0,
  opening_time TIME,
  closing_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salons_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_salons_source_external (source, external_id),
  INDEX idx_salons_city_active (city, is_active)
);

CREATE TABLE IF NOT EXISTS stylists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  salon_id BIGINT UNSIGNED NOT NULL,
  specialties VARCHAR(255),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_path VARCHAR(500),
  deleted_at DATETIME NULL,
  CONSTRAINT fk_stylists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_stylists_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  salon_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_services_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  INDEX idx_services_salon_active (salon_id, is_active)
);

CREATE TABLE IF NOT EXISTS salon_hairstyles (
  salon_id BIGINT UNSIGNED NOT NULL,
  hairstyle_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (salon_id, hairstyle_name),
  CONSTRAINT fk_salon_hairstyles_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  INDEX idx_salon_hairstyles_name (hairstyle_name)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  stylist_id BIGINT UNSIGNED,
  appointment_at DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  notes VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_stylist FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE SET NULL,
  INDEX idx_bookings_user_date (user_id, appointment_at),
  INDEX idx_bookings_stylist_date (stylist_id, appointment_at)
);

CREATE TABLE IF NOT EXISTS face_analyses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  face_shape VARCHAR(50) NOT NULL,
  confidence DECIMAL(5, 2),
  image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analyses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_hairstyles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  hairstyle_name VARCHAR(120) NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_hairstyles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_saved_hairstyle (user_id, hairstyle_name)
);

CREATE TABLE IF NOT EXISTS favorite_salons (
  user_id BIGINT UNSIGNED NOT NULL,
  salon_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, salon_id),
  CONSTRAINT fk_favorite_salons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_salons_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  destination VARCHAR(50),
  reference_id BIGINT UNSIGNED,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  salon_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment VARCHAR(500),
  image_path VARCHAR(500),
  owner_reply VARCHAR(1000),
  owner_replied_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_user_salon (user_id, salon_id)
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_path VARCHAR(500) AFTER comment;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply VARCHAR(1000) AFTER image_path;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_replied_at DATETIME NULL AFTER owner_reply;
ALTER TABLE reviews ADD INDEX IF NOT EXISTS idx_reviews_user_salon (user_id, salon_id);
ALTER TABLE reviews DROP INDEX IF EXISTS uq_user_salon_review;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS destination VARCHAR(50) AFTER message;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id BIGINT UNSIGNED AFTER destination;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(500) AFTER website;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER is_active;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS image_path VARCHAR(500) AFTER is_available;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL AFTER is_available;

CREATE TABLE IF NOT EXISTS salon_portfolio_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  salon_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  caption VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_portfolio_image_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  INDEX idx_portfolio_images_salon (salon_id, created_at)
);

CREATE TABLE IF NOT EXISTS review_replies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT UNSIGNED NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(1000),
  image_path VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_replies_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_replies_review (review_id, created_at)
);

INSERT INTO review_replies (review_id, owner_id, message, created_at)
SELECT r.id, s.owner_id, r.owner_reply, COALESCE(r.owner_replied_at, r.created_at)
FROM reviews r JOIN salons s ON s.id = r.salon_id
WHERE r.owner_reply IS NOT NULL AND s.owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM review_replies rr WHERE rr.review_id = r.id AND rr.message = r.owner_reply);

CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  save_scan_history BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_privacy_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Publicly listed Nasugbu salons. Ratings are intentionally left at zero because
-- third-party review scores should not be copied into the app as FaceFit ratings.
INSERT INTO salons
  (name, description, address, city, phone, website, source, external_id, source_url, opening_time, closing_time)
VALUES
  ('Teves Salon & Spa', 'Hair, salon, spa, beauty and wellness services.', '101 R. Vasquez Street, Barangay 2', 'Nasugbu, Batangas', '09266048784', NULL, 'Public business listing', 'teves-salon-spa', 'https://www.beautynailhairsalons.com/PH/Batangas-City/175920570018095/Teves-salon-and-spa', '09:00:00', '19:00:00'),
  ('Reyes Haircutters', 'Hairdresser and beauty salon.', 'J. P. Laurel Street', 'Nasugbu, Batangas', '(043) 412-0070', NULL, 'Public business listing', 'reyes-haircutters', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('House of Hair Salon', 'Beauty salon.', '171 Ruiz Martinez Street, Barangay 8', 'Nasugbu, Batangas', '09679318604', NULL, 'Public business listing', 'house-of-hair', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('Celing''s Beauty Salon', 'Beauty salon.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', NULL, NULL, 'Public business listing', 'celings-beauty-salon', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('Carmina Beauty Salon', 'Beauty salon.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', NULL, NULL, 'Public business listing', 'carmina-beauty-salon', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('Queen Eva Salon Spa & Wellness', 'Salon, spa and wellness services.', 'J. P. Laurel Street', 'Nasugbu, Batangas', NULL, NULL, 'Public business listing', 'queen-eva-salon', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('Power Touch', 'Beauty salon.', 'F. Alix Street corner Brias Street, Barangay 3', 'Nasugbu, Batangas', '09353391553', NULL, 'Public business listing', 'power-touch', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('NS Salon', 'Beauty salon.', '205 F. Castro Street', 'Nasugbu, Batangas', '(043) 333-8582', NULL, 'Public business listing', 'ns-salon', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-salons/', NULL, NULL),
  ('Salon de Nasugbu', 'Hairdresser and beauty salon.', 'P. Roxas Street, Barangay 9', 'Nasugbu, Batangas', NULL, NULL, 'Public business listing', 'salon-de-nasugbu', 'https://www.cybo.com/PH-biz/salon-de-nasugbu', NULL, NULL),
  ('Bouffant Salon', 'Hair salon.', 'C. Alvarez Street, Poblacion 3', 'Nasugbu, Batangas', '09074382441', NULL, 'Public business listing', 'bouffant-salon', 'https://www.bizippines.com/bouffant-salon-0907-438-2441', '08:00:00', '17:00:00'),
  ('David''s Salon - WalterMart Nasugbu', 'Hair cutting, color, makeup and treatments.', 'Ground Floor, Unit 6, WalterMart, J. P. Laurel Street, Barangay Lumbangan', 'Nasugbu, Batangas', '(043) 741-5704', 'https://www.davidsalon.com.ph/braches/', 'Official salon website', 'davids-waltermart-nasugbu', 'https://www.davidsalon.com.ph/braches/', NULL, NULL),
  ('Octavia Beauty Spa', 'Beauty spa and nail care services.', 'J. P. Laurel Street', 'Nasugbu, Batangas', '09317940146', NULL, 'Public business listing', 'octavia-beauty-spa', 'https://www.cybo.com/PH/nasugbu-batangas/beauty-%26-spas/', NULL, NULL),
  ('Sin City Barber Shop', 'Barber shop listed in public map data.', 'Consuelo Street', 'Nasugbu, Batangas', NULL, NULL, 'OpenStreetMap', 'sin-city-barber-shop', 'https://www.openstreetmap.org/', NULL, NULL),
  ('ZOPHISTICUTS Hair Salon', 'Hair salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09498045372', NULL, 'User-provided listing', 'zophisticuts-hair-salon', NULL, NULL, '21:00:00'),
  ('Glamouroza Salon', 'Beauty salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09154589676', NULL, 'User-provided listing', 'glamouroza-salon', NULL, NULL, '19:00:00'),
  ('Queen Elite Salon', 'Beauty salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', NULL, NULL, 'User-provided listing', 'queen-elite-salon', NULL, NULL, NULL),
  ('David''s Cut', 'Hair salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', NULL, NULL, 'User-provided listing', 'davids-cut', NULL, NULL, NULL),
  ('Jing''s Beauty Salon', 'Beauty salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09649443768', NULL, 'User-provided listing', 'jings-beauty-salon', NULL, NULL, '17:00:00'),
  ('AJ Way Massage & Spa', 'Massage and spa services in Nasugbu.', '105 Concepcion Building, Concepcion Street', 'Nasugbu, Batangas', '09814415160', NULL, 'User-provided listing', 'aj-way-massage-spa', NULL, NULL, '02:00:00'),
  ('Charms Nailed It', 'Nail salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09654171004', NULL, 'User-provided listing', 'charms-nailed-it', NULL, '00:00:00', '23:59:59'),
  ('The Glam Studio', 'Nail salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09365221900', NULL, 'User-provided listing', 'the-glam-studio', NULL, NULL, '19:00:00'),
  ('L Hair Studio', 'Hair salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09275001830', NULL, 'User-provided listing', 'l-hair-studio', NULL, NULL, '18:00:00'),
  ('DanieLash & Nails', 'Beauty and nail salon in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09515831242', NULL, 'User-provided listing', 'danielash-and-nails', NULL, NULL, '21:00:00'),
  ('Touch of Bliss Beauty & Spa', 'Facial spa in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09067506492', NULL, 'User-provided listing', 'touch-of-bliss-beauty-spa', NULL, NULL, '18:00:00'),
  ('CouCoutek Nail Spa', 'Nail spa in Nasugbu.', 'Nasugbu, Batangas', 'Nasugbu, Batangas', '09062584133', NULL, 'User-provided listing', 'coucoutek-nail-spa', NULL, NULL, '20:00:00')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description), address = VALUES(address),
  city = VALUES(city), phone = VALUES(phone), website = VALUES(website),
  source_url = VALUES(source_url), opening_time = VALUES(opening_time),
  closing_time = VALUES(closing_time), is_active = TRUE;

-- Coordinates decoded from the businesses' published Plus Codes. These are
-- updated separately so an existing FaceFit database receives them on db:init.
UPDATE salons SET latitude = 14.0771125, longitude = 120.6313281
WHERE source = 'Public business listing' AND external_id = 'teves-salon-spa';
UPDATE salons SET latitude = 14.0686625, longitude = 120.6328906
WHERE source = 'Public business listing' AND external_id = 'reyes-haircutters';
UPDATE salons SET latitude = 14.0621125, longitude = 120.6344531
WHERE source = 'Public business listing' AND external_id = 'queen-eva-salon';
UPDATE salons SET latitude = 14.0750375, longitude = 120.6314844
WHERE source = 'Public business listing' AND external_id = 'octavia-beauty-spa';
UPDATE salons SET latitude = 14.0675290, longitude = 120.6338906
WHERE source = 'OpenStreetMap' AND external_id = 'sin-city-barber-shop';

-- Contact corrections supplied by the project owner for existing records.
UPDATE salons SET phone = '09565500812', closing_time = '18:30:00'
WHERE source = 'Public business listing' AND external_id = 'house-of-hair';
UPDATE salons SET phone = '09757197612'
WHERE source = 'Public business listing' AND external_id = 'reyes-haircutters';
UPDATE salons SET phone = '09666387445', closing_time = '21:00:00'
WHERE source = 'Public business listing' AND external_id = 'queen-eva-salon';

-- Editable FaceFit starter services. These make each imported salon bookable
-- without presenting the prices as the salon's verified official menu.
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Classic Haircut', 'FaceFit starter service — salon owners can edit this offering.', 350.00, 60
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv
  WHERE sv.salon_id = s.id AND sv.name = 'Classic Haircut'
    AND sv.is_active = TRUE AND sv.deleted_at IS NULL
);
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Hair Color', 'FaceFit starter service — final price may vary after consultation.', 1200.00, 120
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv
  WHERE sv.salon_id = s.id AND sv.name = 'Hair Color'
    AND sv.is_active = TRUE AND sv.deleted_at IS NULL
);
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Hair Treatment', 'FaceFit starter service — final treatment depends on hair condition.', 800.00, 90
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv
  WHERE sv.salon_id = s.id AND sv.name = 'Hair Treatment'
    AND sv.is_active = TRUE AND sv.deleted_at IS NULL
);

-- Expanded starter menu for salons that have not published these offerings yet.
-- Owners can edit or remove each item from salon management.
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, menu.name, menu.description, menu.price, menu.duration_minutes
FROM salons s
CROSS JOIN (
  SELECT 'Premium Style Haircut' AS name, 'Consultation, precision haircut, and basic styling. Starter price; final price may vary by hair length.' AS description, 550.00 AS price, 75 AS duration_minutes
  UNION ALL SELECT 'Kids Haircut', 'Haircut for children aged 12 and below.', 250.00, 45
  UNION ALL SELECT 'Shampoo & Blow Dry', 'Hair wash followed by a smooth or volumized blow-dry finish.', 300.00, 45
  UNION ALL SELECT 'Event Hair Styling', 'Styled finish for parties, graduations, and special occasions.', 700.00, 75
  UNION ALL SELECT 'Highlights', 'Partial highlights with consultation and finishing style.', 1500.00, 150
  UNION ALL SELECT 'Keratin Treatment', 'Smoothing treatment; final price depends on hair length and condition.', 1800.00, 150
  UNION ALL SELECT 'Hair Spa', 'Deep-conditioning hair and scalp care treatment.', 650.00, 75
  UNION ALL SELECT 'Hair Rebonding', 'Straightening service; final price depends on hair length and condition.', 2500.00, 240
  UNION ALL SELECT 'Hair Perm', 'Texture and curl service with consultation.', 1800.00, 180
  UNION ALL SELECT 'Beard Trim & Styling', 'Beard shaping, trimming, and finishing.', 200.00, 30
  UNION ALL SELECT 'Style Consultation', 'Discuss your FaceFit recommendation with a salon professional.', 200.00, 30
) AS menu
WHERE NOT EXISTS (
  SELECT 1 FROM services sv
  WHERE sv.salon_id = s.id AND sv.name = menu.name
    AND sv.is_active = TRUE AND sv.deleted_at IS NULL
);

-- Starter hairstyle availability. Each style is assigned to a focused subset
-- of salons so customers only see locations that offer their selected look.
INSERT IGNORE INTO salon_hairstyles (salon_id, hairstyle_name)
SELECT s.id, styles.name
FROM salons s
CROSS JOIN (
  SELECT 0 AS style_index, 'Textured Crop' AS name
  UNION ALL SELECT 1, 'Classic Side Part'
  UNION ALL SELECT 2, 'Modern Quiff'
  UNION ALL SELECT 3, 'Short Pompadour'
  UNION ALL SELECT 4, 'High Fade with Volume'
  UNION ALL SELECT 5, 'Angular Fringe'
  UNION ALL SELECT 6, 'Textured Quiff'
  UNION ALL SELECT 7, 'Side-Part Undercut'
  UNION ALL SELECT 8, 'Textured Crew Cut'
  UNION ALL SELECT 9, 'Short Quiff'
  UNION ALL SELECT 10, 'Low Fade Crop'
  UNION ALL SELECT 11, 'Textured Fringe'
  UNION ALL SELECT 12, 'Medium Side Sweep'
  UNION ALL SELECT 13, 'Low Fade Quiff'
  UNION ALL SELECT 14, 'Layered Bro Flow'
  UNION ALL SELECT 15, 'Side-Swept Crop'
  UNION ALL SELECT 16, 'Caesar Cut'
  UNION ALL SELECT 17, 'Medium Textured Fringe'
  UNION ALL SELECT 18, 'Classic Taper'
  UNION ALL SELECT 19, 'Side-Part Taper'
  UNION ALL SELECT 20, 'Messy Medium Crop'
  UNION ALL SELECT 21, 'Bro Flow'
) AS styles
WHERE MOD(s.id + styles.style_index, 3) = 0;

-- Non-login demo staff profiles for customer-facing salon previews.
-- The random password hash has no known login password.
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role)
SELECT 'Alex Reyes', CONCAT('alex.salon', s.id, '@facefit.local'),
       '$2b$12$V62YlpeyhT3cdp1GP4UJYem0s6IHeI3daKsXrc.Tqe.CcR82d1/2S',
       NULL, 'stylist'
FROM salons s;
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role)
SELECT 'Mika Santos', CONCAT('mika.salon', s.id, '@facefit.local'),
       '$2b$12$V62YlpeyhT3cdp1GP4UJYem0s6IHeI3daKsXrc.Tqe.CcR82d1/2S',
       NULL, 'stylist'
FROM salons s;
INSERT INTO stylists (user_id, salon_id, specialties, is_available)
SELECT u.id, s.id, 'Precision cuts, fades, and FaceFit recommendations', TRUE
FROM salons s
JOIN users u ON u.email = CONCAT('alex.salon', s.id, '@facefit.local')
WHERE NOT EXISTS (SELECT 1 FROM stylists st WHERE st.user_id = u.id);
INSERT INTO stylists (user_id, salon_id, specialties, is_available)
SELECT u.id, s.id, 'Color, treatments, styling, and consultations', TRUE
FROM salons s
JOIN users u ON u.email = CONCAT('mika.salon', s.id, '@facefit.local')
WHERE NOT EXISTS (SELECT 1 FROM stylists st WHERE st.user_id = u.id);

-- Non-login demo customers used only to provide representative salon reviews.
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role) VALUES
  ('Angela Cruz', 'demo.review.angela@facefit.local', '$2b$12$V62YlpeyhT3cdp1GP4UJYem0s6IHeI3daKsXrc.Tqe.CcR82d1/2S', NULL, 'customer'),
  ('Carlo Mendoza', 'demo.review.carlo@facefit.local', '$2b$12$V62YlpeyhT3cdp1GP4UJYem0s6IHeI3daKsXrc.Tqe.CcR82d1/2S', NULL, 'customer'),
  ('Mae Villanueva', 'demo.review.mae@facefit.local', '$2b$12$V62YlpeyhT3cdp1GP4UJYem0s6IHeI3daKsXrc.Tqe.CcR82d1/2S', NULL, 'customer');

INSERT INTO reviews (user_id, salon_id, rating, comment)
SELECT u.id, s.id, 5, 'Friendly staff and a clean, comfortable salon. The consultation was clear and helpful.'
FROM salons s JOIN users u ON u.email = 'demo.review.angela@facefit.local'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r WHERE r.user_id = u.id AND r.salon_id = s.id
    AND r.comment = 'Friendly staff and a clean, comfortable salon. The consultation was clear and helpful.'
);
INSERT INTO reviews (user_id, salon_id, rating, comment)
SELECT u.id, s.id, 4, 'The service started on time and the stylist listened carefully to the look I wanted.'
FROM salons s JOIN users u ON u.email = 'demo.review.carlo@facefit.local'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r WHERE r.user_id = u.id AND r.salon_id = s.id
    AND r.comment = 'The service started on time and the stylist listened carefully to the look I wanted.'
);
INSERT INTO reviews (user_id, salon_id, rating, comment)
SELECT u.id, s.id, 5, 'Great result and professional service. I would book here again for my next haircut.'
FROM salons s JOIN users u ON u.email = 'demo.review.mae@facefit.local'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r WHERE r.user_id = u.id AND r.salon_id = s.id
    AND r.comment = 'Great result and professional service. I would book here again for my next haircut.'
);

UPDATE salons s
SET s.rating = (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.salon_id = s.id);
