//Module for database variables and initialising pg-promise connections -Vin

const pgp = require('pg-promise')();

// Connection for admin operations (register, auth)
const cn = {
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'blogapp',
  user: process.env.POSTGRES_ADMIN_USER || 'blogapp_admin',
  password: process.env.POSTGRES_ADMIN_PASSWORD || 'blogapp_admin_password',
  max: 30 // connection pool limit
};

// Connection for read-only posts operations
const cn_posts = {
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'blogapp',
  user: process.env.POSTGRES_USER || 'blogapp_user',
  password: process.env.POSTGRES_PASSWORD || 'blogapp_user_password',
  max: 30 // connection pool limit
};

const db = pgp(cn);
const db_posts = pgp(cn_posts);

async function verifyDatabaseConnection() {
  try {
    await db.one('SELECT NOW()');
    console.log('Postgres connected');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

module.exports = { db, db_posts, verifyDatabaseConnection };