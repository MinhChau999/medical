import { Sequelize } from 'sequelize';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Sequelize instance for ORM
export const sequelize = new Sequelize({
  host: process.env.DATABASE_HOST!,
  port: parseInt(process.env.DATABASE_PORT!),
  database: process.env.DATABASE_NAME!,
  username: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  dialect: 'postgres',
  pool: {
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
    idle: 30000,
    acquire: 2000,
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Pool instance for raw queries (backward compatibility)
const pool = new Pool({
  host: process.env.DATABASE_HOST!,
  port: parseInt(process.env.DATABASE_PORT!),
  database: process.env.DATABASE_NAME!,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;