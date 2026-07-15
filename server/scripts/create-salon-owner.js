require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

function readArgument(name, fallback = '') {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim();
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : fallback;
}

async function main() {
  const salonExternalId = readArgument('salon', 'teves-salon-spa');
  const fullName = readArgument('name', 'Teves Salon & Spa Owner');
  const email = readArgument('email', 'teves.owner@facefit.local').toLowerCase();
  const phone = readArgument('phone', '09266048784');
  const suppliedPassword = readArgument('password');

  if (!/^\S+@\S+\.\S+$/.test(email) || (suppliedPassword && suppliedPassword.length < 8)) {
    throw new Error('Provide a valid email and a password of at least 8 characters.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [salons] = await connection.execute(
      `SELECT s.id, s.name, s.phone, s.owner_id AS ownerId, u.email AS ownerEmail
       FROM salons s LEFT JOIN users u ON u.id = s.owner_id
       WHERE s.external_id = ? LIMIT 1 FOR UPDATE`,
      [salonExternalId],
    );
    const salon = salons[0];
    if (!salon) throw new Error(`Salon "${salonExternalId}" was not found. Run the salon import first.`);

    const [users] = await connection.execute(
      'SELECT id, role FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [email],
    );
    let userId = users[0]?.id;
    if (salon.ownerId && salon.ownerId !== userId) {
      throw new Error(`${salon.name} is already linked to ${salon.ownerEmail || `user ${salon.ownerId}`}.`);
    }
    if (users[0] && users[0].role !== 'owner') {
      throw new Error(`The email ${email} already belongs to a ${users[0].role} account.`);
    }

    const password = suppliedPassword || (!userId ? `Teves-${crypto.randomBytes(9).toString('base64url')}!` : '');
    if (userId) {
      if (password) {
        const passwordHash = await bcrypt.hash(password, 12);
        await connection.execute(
          'UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = ? WHERE id = ?',
          [fullName, phone || salon.phone || null, passwordHash, 'owner', userId],
        );
      } else {
        await connection.execute(
          'UPDATE users SET full_name = ?, phone = ?, role = ? WHERE id = ?',
          [fullName, phone || salon.phone || null, 'owner', userId],
        );
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await connection.execute(
        'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
        [fullName, email, passwordHash, phone || salon.phone || null, 'owner'],
      );
      userId = result.insertId;
    }

    await connection.execute('UPDATE salons SET owner_id = ? WHERE id = ?', [userId, salon.id]);
    await connection.commit();

    console.log(`Salon owner account ${users[0] ? 'updated' : 'created'} successfully.`);
    console.log(`Salon: ${salon.name}`);
    console.log(`Email: ${email}`);
    console.log(password ? `Password: ${password}` : 'Password: unchanged');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
