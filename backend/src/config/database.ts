import { Sequelize } from 'sequelize';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Sequelize instance for ORM
export const sequelize = new Sequelize({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'medical',
  username: process.env.DATABASE_USER || 'dobby',
  password: process.env.DATABASE_PASSWORD || 'root@123',
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
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'medical',
  user: process.env.DATABASE_USER || 'dobby',
  password: process.env.DATABASE_PASSWORD || 'root@123',
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