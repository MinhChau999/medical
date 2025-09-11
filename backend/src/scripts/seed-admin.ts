import bcrypt from 'bcrypt';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function seedAdmin() {
  const client = await pool.connect();
  
  try {
    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@medical.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, role`,
      [
        userId,
        'admin@medical.com',
        hashedPassword,
        'Admin',
        'User',
        '0123456789',
        'admin',
        'active'
      ]
    );

    await client.query('COMMIT');
    
    console.log('Admin user created successfully:', userResult.rows[0]);
    console.log('Email: admin@medical.com');
    console.log('Password: password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating admin user:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedAdmin();