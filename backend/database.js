import initSqlJs from 'sql.js';
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'rential.db');

const { Pool } = pg;
let pool = null;
let sqliteDb = null;
export let isPostgres = !!process.env.DATABASE_URL;

export async function initializeDatabase() {
  if (isPostgres) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      await pool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed, falling back to SQLite:', error.message);
      isPostgres = false;
    }
  }

  if (!isPostgres) {
    const SQL = await initSqlJs();
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      sqliteDb = new SQL.Database(buffer);
      console.log('✅ SQLite database loaded from file');
    } else {
      sqliteDb = new SQL.Database();
      console.log('✅ New SQLite database created');
    }
  }

  const runQuery = isPostgres ? (q, p) => pool.query(convertSql(q), p) : (q, p) => sqliteDb.run(q, p);

  // Schema queries
  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      firebase_uid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'owner',
      phone TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS properties (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      type TEXT NOT NULL,
      rooms INTEGER NOT NULL,
      monthly_rent REAL NOT NULL,
      status TEXT DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tenants (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      property_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      move_in_date TEXT,
      move_out_date TEXT,
      monthly_rent REAL,
      is_paid INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      property_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const q of schema) {
    if (isPostgres) {
      await pool.query(q);
    } else {
      sqliteDb.run(q);
    }
  }

  // Create demo user
  const checkDemoSql = 'SELECT * FROM users WHERE email = $1';
  const demoUsers = isPostgres
    ? (await pool.query(convertSql(checkDemoSql), ['demo@example.com'])).rows
    : sqliteDb.exec('SELECT * FROM users WHERE email = "demo@example.com"');

  const hasDemo = isPostgres ? demoUsers.length > 0 : (demoUsers.length > 0 && demoUsers[0].values.length > 0);

  if (!hasDemo) {
    const insertDemoSql = 'INSERT INTO users (name, email, firebase_uid, role) VALUES (?, ?, ?, ?)';
    if (isPostgres) {
      await pool.query(convertSql(insertDemoSql), ['Demo User', 'demo@example.com', 'demo-user-uid', 'admin']);
    } else {
      sqliteDb.run(insertDemoSql, ['Demo User', 'demo@example.com', 'demo-user-uid', 'admin']);
      saveDatabase();
    }
    console.log('✅ Demo user created');
  }

  console.log(`✅ Database initialized successfully (${isPostgres ? 'PostgreSQL' : 'SQLite'})`);
}

function convertSql(sql) {
  if (!isPostgres) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export async function get(sql, params = []) {
  if (isPostgres) {
    const res = await pool.query(convertSql(sql), params);
    return res.rows[0] || null;
  } else {
    const res = sqliteDb.exec(sql, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values[0];
      return Object.fromEntries(columns.map((col, i) => [col, values[i]]));
    }
    return null;
  }
}

export async function all(sql, params = []) {
  if (isPostgres) {
    const res = await pool.query(convertSql(sql), params);
    return res.rows;
  } else {
    const res = sqliteDb.exec(sql, params);
    if (res.length > 0) {
      const columns = res[0].columns;
      return res[0].values.map(values => Object.fromEntries(columns.map((col, i) => [col, values[i]])));
    }
    return [];
  }
}

export async function run(sql, params = []) {
  if (isPostgres) {
    // If it's an insert without RETURNING, we add it to get the ID back
    let finalSql = convertSql(sql);
    const res = await pool.query(finalSql, params);
    return {
      lastInsertRowid: res.rows[0]?.id || null,
      changes: res.rowCount
    };
  } else {
    // Strip RETURNING id for SQLite
    const sqliteSql = sql.replace(/RETURNING id/i, '').trim();
    sqliteDb.run(sqliteSql, params);
    saveDatabase();

    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = sqliteDb.exec('SELECT last_insert_rowid() as id');
      if (result.length > 0) {
        return { lastInsertRowid: result[0].values[0][0] };
      }
    }
    return { changes: 1 };
  }
}

export function saveDatabase() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

export default { initializeDatabase, get, all, run, saveDatabase };
