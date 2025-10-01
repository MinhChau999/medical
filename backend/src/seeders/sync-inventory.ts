import pool from '../config/database';

/**
 * Sync existing product_variants stock into inventory table
 * This ensures proper 3-table architecture
 */
async function syncInventory() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get main warehouse
    const warehouseResult = await client.query(`
      SELECT id FROM warehouses WHERE code = 'WH001' LIMIT 1
    `);

    if (warehouseResult.rows.length === 0) {
      throw new Error('Main warehouse not found');
    }

    const warehouseId = warehouseResult.rows[0].id;
    console.log('📦 Using warehouse:', warehouseId);

    // Get all product variants with stock
    const variantsResult = await client.query(`
      SELECT id, sku, stock_quantity, reserved_quantity
      FROM product_variants
      WHERE is_active = true
    `);

    console.log(`\n🔄 Found ${variantsResult.rows.length} active variants to sync\n`);

    let synced = 0;
    let skipped = 0;

    for (const variant of variantsResult.rows) {
      // Check if inventory record already exists
      const existingResult = await client.query(`
        SELECT id FROM inventory
        WHERE warehouse_id = $1 AND variant_id = $2
      `, [warehouseId, variant.id]);

      if (existingResult.rows.length > 0) {
        console.log(`⏭️  SKU ${variant.sku}: Already has inventory record - skipping`);
        skipped++;
        continue;
      }

      // Create inventory record
      await client.query(`
        INSERT INTO inventory (
          warehouse_id,
          variant_id,
          quantity,
          reserved_quantity,
          last_restocked_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [
        warehouseId,
        variant.id,
        variant.stock_quantity || 0,
        variant.reserved_quantity || 0
      ]);

      console.log(`✅ SKU ${variant.sku}: Synced ${variant.stock_quantity} units to inventory`);
      synced++;
    }

    await client.query('COMMIT');

    console.log('\n📊 Summary:');
    console.log(`  ✅ Synced: ${synced} variants`);
    console.log(`  ⏭️  Skipped: ${skipped} variants (already exist)`);
    console.log(`  📦 Total inventory records: ${synced + skipped}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error syncing inventory:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  syncInventory()
    .then(() => {
      console.log('\n✅ Inventory sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Inventory sync failed:', error);
      process.exit(1);
    });
}

export default syncInventory;
