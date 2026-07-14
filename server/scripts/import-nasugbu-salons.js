require('dotenv').config();

const dryRun = process.argv.includes('--dry-run');
const overpassUrls = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const query = `
[out:json][timeout:60];
(
  nwr["shop"="hairdresser"](13.90,120.55,14.20,120.78);
  nwr["shop"="beauty"](13.90,120.55,14.20,120.78);
  nwr["beauty"="salon"](13.90,120.55,14.20,120.78);
);
out center tags;
`;

function formatAddress(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  return [street, tags['addr:barangay'], tags['addr:suburb']].filter(Boolean).join(', ') || 'Nasugbu, Batangas';
}

function normalize(element) {
  const tags = element.tags || {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!tags.name || latitude == null || longitude == null) return null;

  return {
    name: tags.name,
    description: tags.description || 'Public salon listing from OpenStreetMap.',
    address: formatAddress(tags),
    city: 'Nasugbu, Batangas',
    latitude,
    longitude,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || tags.facebook || null,
    source: 'OpenStreetMap',
    externalId: `${element.type}/${element.id}`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    openingHours: tags.opening_hours || null,
  };
}

async function fetchSalons() {
  let lastError;
  for (const overpassUrl of overpassUrls) {
    try {
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'FaceFit student project salon importer',
        },
        body: new URLSearchParams({ data: query }),
      });
      if (!response.ok) throw new Error(`${overpassUrl} returned HTTP ${response.status}`);
      const result = await response.json();
      return result.elements.map(normalize).filter(Boolean);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function main() {
  const salons = await fetchSalons();
  console.log(`Found ${salons.length} mapped salons in Nasugbu, Batangas.`);

  if (dryRun) {
    console.table(salons.map(({ name, address, latitude, longitude }) => ({ name, address, latitude, longitude })));
    return;
  }

  const pool = require('../src/db');
  try {
    for (const salon of salons) {
      await pool.execute(
        `INSERT INTO salons
          (name, description, address, city, latitude, longitude, phone, website, source, external_id, source_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name), description = VALUES(description), address = VALUES(address),
          city = VALUES(city), latitude = VALUES(latitude), longitude = VALUES(longitude),
          phone = VALUES(phone), website = VALUES(website), source_url = VALUES(source_url), is_active = TRUE`,
        [salon.name, salon.description, salon.address, salon.city, salon.latitude, salon.longitude,
          salon.phone, salon.website, salon.source, salon.externalId, salon.sourceUrl],
      );
    }
  } finally {
    await pool.end();
  }
  console.log(`Imported ${salons.length} salons. OpenStreetMap attribution must be shown in the app.`);
}

main().catch((error) => {
  console.error('Salon import failed:', error.message);
  process.exit(1);
});
