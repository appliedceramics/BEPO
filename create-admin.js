import crypto from 'crypto';
import { promisify } from 'util';
import pg from 'pg';
const { Client } = pg;

const scryptAsync = promisify(crypto.scrypt);

/**
 * Hashes a password using scrypt
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

(async () => {
  // Connect to database
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  try {
    // Hash the password
    const hashedPassword = await hashPassword('Z4greb2@');
    
    // Create a new admin user
    const res = await client.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      ['admin', 'admin@bepo.app', hashedPassword]
    );
    
    console.log('Created admin user:', res.rows[0]);
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await client.end();
  }
})();