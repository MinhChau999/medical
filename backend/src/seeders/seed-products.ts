import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { logger } from '../utils/logger';

const sampleProducts = [
  // Premium Medical Products Demo Data
  {
    name: 'Paracetamol 500mg',
    sku: 'MED-001',
    description: 'Pain reliever and fever reducer tablets. Effective for mild to moderate pain relief and fever reduction. Contains 30 tablets per box.',
    price: 12.99,
    stockQuantity: 245,
    reorderLevel: 50,
    unit: 'box',
    status: 'active' as 'active' | 'inactive',
    brand: 'MediCare Plus',
    manufacturer: 'Healthcare Solutions Ltd',
    barcode: '1234567890123',
    categoryName: 'Pain Relief',
    batchNumber: 'PAR2024A15',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&auto=format'
    ]
  },
  {
    name: 'Digital Blood Pressure Monitor',
    sku: 'DEV-001',
    description: 'Professional automatic digital blood pressure monitor with large LCD display. Includes memory for 2 users with 60 measurements each.',
    price: 89.99,
    stockQuantity: 35,
    reorderLevel: 10,
    unit: 'piece',
    status: 'active' as 'active' | 'inactive',
    brand: 'CardioTech Pro',
    manufacturer: 'Medical Devices International',
    barcode: '1234567890124',
    categoryName: 'Medical Devices',
    batchNumber: 'BPM2024X7',
    image: 'https://images.unsplash.com/photo-1615461065929-4f8ffed6ca40?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1615461065929-4f8ffed6ca40?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop&auto=format'
    ]
  },
  {
    name: 'Amoxicillin 500mg Capsules',
    sku: 'ANT-001',
    description: 'Broad-spectrum antibiotic capsules for bacterial infections. 21 capsules per pack. Prescription required.',
    price: 28.50,
    stockQuantity: 8,
    reorderLevel: 15,
    unit: 'pack',
    status: 'active' as 'active' | 'inactive',
    brand: 'AntiBiotics Pro',
    manufacturer: 'PharmaCeuticals Global',
    barcode: '1234567890125',
    categoryName: 'Antibiotics',
    expiryDate: '2025-01-15',
    batchNumber: 'AMX2024B3',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format'
    ]
  },
  {
    name: 'Vitamin D3 5000IU Softgels',
    sku: 'VIT-001',
    description: 'High-potency Vitamin D3 softgels for bone health and immune support. 90 softgels per bottle.',
    price: 24.99,
    stockQuantity: 156,
    reorderLevel: 30,
    unit: 'bottle',
    status: 'active' as 'active' | 'inactive',
    brand: 'VitaHealth Premium',
    manufacturer: 'Nutritional Sciences Corp',
    barcode: '1234567890126',
    categoryName: 'Vitamins',
    batchNumber: 'VD32024C9',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format'
    ]
  },
  {
    name: 'Sterile Gauze Pads 4x4 inch',
    sku: 'FA-001',
    description: 'Sterile gauze pads for wound care and dressing. Pack of 50 individually wrapped pads.',
    price: 15.75,
    stockQuantity: 89,
    reorderLevel: 25,
    unit: 'pack',
    status: 'active' as 'active' | 'inactive',
    brand: 'MedSupply Pro',
    manufacturer: 'Surgical Materials Inc',
    barcode: '1234567890127',
    categoryName: 'First Aid',
    batchNumber: 'GP2024D12',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1615461065929-4f8ffed6ca40?w=400&h=400&fit=crop&auto=format'
    ]
  },
  {
    name: 'Honey & Lemon Cough Syrup',
    sku: 'CF-001',
    description: 'Natural honey and lemon cough syrup with menthol. Soothes throat and relieves cough. 200ml bottle.',
    price: 18.99,
    stockQuantity: 67,
    reorderLevel: 20,
    unit: 'bottle',
    status: 'active' as 'active' | 'inactive',
    brand: 'NaturalCare',
    manufacturer: 'Herbal Remedies Ltd',
    barcode: '1234567890128',
    categoryName: 'Cold & Flu',
    expiryDate: '2025-11-30',
    batchNumber: 'HLC2024E8',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&auto=format'
    ]
  }
];

export async function seedProducts() {
  try {
    logger.info('Starting product seeding...');

    // Get all categories
    const categories = await Category.findAll();
    const categoryMap = new Map(categories.map((c: Category) => [c.name, c.id]));

    // Add sample products
    for (const productData of sampleProducts) {
      const { categoryName, ...product } = productData;
      
      // Find category ID
      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        logger.warn(`Category "${categoryName}" not found for product ${product.sku}`);
        continue;
      }

      // Check if product already exists
      const existingProduct = await Product.findOne({
        where: { sku: product.sku }
      });

      if (!existingProduct) {
        await Product.create({
          ...product,
          categoryId
        });
        logger.info(`Created product: ${product.name}`);
      } else {
        logger.info(`Product already exists: ${product.name}`);
      }
    }

    logger.info('Product seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedProducts()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}