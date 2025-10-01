import pool from '../config/database';

async function seedWarehouses() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check existing warehouses
    const existingResult = await client.query('SELECT COUNT(*) as count FROM warehouses');
    const existingCount = parseInt(existingResult.rows[0].count);

    if (existingCount > 1) {
      console.log(`⏭️  Already have ${existingCount} warehouses. Skipping...`);
      await client.query('COMMIT');
      return;
    }

    // Insert additional warehouses
    const warehouses = [
      {
        code: 'WH002',
        name: 'Kho Hồ Chí Minh',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028-1234-5678'
      },
      {
        code: 'WH003',
        name: 'Kho Đà Nẵng',
        address: '456 Trần Phú, Hải Châu, Đà Nẵng',
        phone: '0236-123-4567'
      },
      {
        code: 'WH004',
        name: 'Kho Cần Thơ',
        address: '789 Mậu Thân, Ninh Kiều, Cần Thơ',
        phone: '0292-123-4567'
      }
    ];

    for (const wh of warehouses) {
      await client.query(`
        INSERT INTO warehouses (code, name, address, phone, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (code) DO NOTHING
      `, [wh.code, wh.name, wh.address, wh.phone]);

      console.log(`✅ Created warehouse: ${wh.name}`);
    }

    await client.query('COMMIT');
    console.log('\n📦 Warehouse seeding completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding warehouses:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedWarehouses()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export default seedWarehouses;
