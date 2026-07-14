require('dotenv').config();

const app = require('./app');
const pool = require('./db');

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => {
  console.log(`FaceFit API running at http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing FaceFit API...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
