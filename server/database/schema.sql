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
  role ENUM('customer', 'stylist', 'owner', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  CONSTRAINT fk_services_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  INDEX idx_services_salon_active (salon_id, is_active)
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
  ('David''s Salon - WalterMart Nasugbu', 'Hair cutting, color, makeup and treatments.', 'Ground Floor, Unit 6, WalterMart, J. P. Laurel Street, Barangay Lumbangan', 'Nasugbu, Batangas', '(043) 741-5704', 'https://www.davidsalon.com.ph/braches/', 'Official salon website', 'davids-waltermart-nasugbu', 'https://www.davidsalon.com.ph/braches/', NULL, NULL)
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

-- Editable FaceFit starter services. These make each imported salon bookable
-- without presenting the prices as the salon's verified official menu.
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Classic Haircut', 'FaceFit starter service — salon owners can edit this offering.', 350.00, 60
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv WHERE sv.salon_id = s.id AND sv.name = 'Classic Haircut'
);
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Hair Color', 'FaceFit starter service — final price may vary after consultation.', 1200.00, 120
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv WHERE sv.salon_id = s.id AND sv.name = 'Hair Color'
);
INSERT INTO services (salon_id, name, description, price, duration_minutes)
SELECT s.id, 'Hair Treatment', 'FaceFit starter service — final treatment depends on hair condition.', 800.00, 90
FROM salons s WHERE NOT EXISTS (
  SELECT 1 FROM services sv WHERE sv.salon_id = s.id AND sv.name = 'Hair Treatment'
);
