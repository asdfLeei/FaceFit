# FaceFit API

Express API backed by MySQL. It is isolated from the Expo package so mobile and web builds are unchanged.

## Setup

1. Install and start MySQL 8 or MariaDB.
2. Copy `.env.example` to `.env` and enter your MySQL credentials.
3. Install packages with `npm install`.
4. Create the database and tables with `npm run db:init`.
5. Start the API with `npm run dev`.

## Import real Nasugbu salons

After initializing the database, import currently mapped salons with:

```powershell
npm run salons:preview
npm run salons:import
```

The importer fetches hairdresser and beauty-salon map features inside the Nasugbu administrative boundary from OpenStreetMap. It stores coordinates and source links and safely updates previously imported records. Public map coverage is community-maintained, so this cannot guarantee every operating salon is listed. Display `© OpenStreetMap contributors` anywhere this data appears in the app.

The schema also seeds 11 publicly verified Nasugbu salon records. These records have source links, use no copied third-party rating, and are upserted safely whenever `npm run db:init` is run.

The API runs at `http://localhost:4000` by default. Test it with `GET /api/health`.

## Starter endpoints

- `GET /api/health`
- `GET /api/salons?search=makati`
- `GET /api/salons/:salonId/services`
- `POST /api/bookings`

Example booking body:

```json
{
  "userId": 1,
  "serviceId": 1,
  "stylistId": 1,
  "appointmentAt": "2026-07-16 13:00:00",
  "notes": "Soft layered lob"
}
```

For a physical phone, use your computer's LAN address instead of `localhost`, such as `http://192.168.1.10:4000`.

## Connect the Expo app

Create `FaceFit/.env` (outside this server folder) and set:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For a physical phone, replace `localhost` with the computer's Wi-Fi IPv4 address. Restart Expo after changing this value. The salon list and profile screens request their records from this API.
