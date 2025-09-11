import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { logger } from '../utils/logger';

const sampleProducts = [
  // Pain Relief
  {
    name: 'Paracetamol 500mg',
    sku: 'MED-001',
    description: 'Pain reliever and fever reducer. Effective for mild to moderate pain.',
    price: 5.99,
    stockQuantity: 500,
    reorderLevel: 100,
    unit: 'box',
    status: 'active',
    brand: 'PharmaCare',
    manufacturer: 'PharmaCare Industries',
    barcode: '1234567890123',
    categoryName: 'Pain Relief',
    images: [
      'https://s3-hcm-r2.s3cloud.vn/medical/products/paracetamol-500mg.webp'
    ]
  },
  {
    name: 'Ibuprofen 400mg',
    sku: 'MED-002',
    description: 'Anti-inflammatory pain reliever. Reduces pain, fever, and inflammation.',
    price: 8.99,
    stockQuantity: 350,
    reorderLevel: 75,
    unit: 'box',
    status: 'active',
    brand: 'MediRelief',
    manufacturer: 'MediRelief Corp',
    barcode: '1234567890124',
    categoryName: 'Pain Relief',
    images: []
  },
  {
    name: 'Aspirin 100mg',
    sku: 'MED-003',
    description: 'Blood thinner and pain reliever. Prevents heart attacks and strokes.',
    price: 6.49,
    stockQuantity: 200,
    reorderLevel: 50,
    unit: 'bottle',
    status: 'active',
    brand: 'CardioGuard',
    manufacturer: 'CardioGuard Pharma',
    barcode: '1234567890125',
    categoryName: 'Pain Relief',
    images: []
  },

  // Antibiotics
  {
    name: 'Amoxicillin 500mg',
    sku: 'ANT-001',
    description: 'Broad-spectrum antibiotic for bacterial infections.',
    price: 15.99,
    stockQuantity: 150,
    reorderLevel: 30,
    unit: 'box',
    status: 'active',
    brand: 'AntiBac',
    manufacturer: 'AntiBac Pharmaceuticals',
    barcode: '1234567890126',
    categoryName: 'Antibiotics',
    expiryDate: '2025-12-31',
    batchNumber: 'AB2024001',
    images: []
  },
  {
    name: 'Azithromycin 250mg',
    sku: 'ANT-002',
    description: 'Macrolide antibiotic for respiratory infections.',
    price: 22.99,
    stockQuantity: 80,
    reorderLevel: 20,
    unit: 'pack',
    status: 'active',
    brand: 'ZithroMax',
    manufacturer: 'Global Antibiotics',
    barcode: '1234567890127',
    categoryName: 'Antibiotics',
    expiryDate: '2025-10-31',
    batchNumber: 'ZM2024002',
    images: []
  },
  {
    name: 'Ciprofloxacin 500mg',
    sku: 'ANT-003',
    description: 'Fluoroquinolone antibiotic for UTIs and other infections.',
    price: 18.99,
    stockQuantity: 5,
    reorderLevel: 25,
    unit: 'box',
    status: 'active',
    brand: 'CiproHealth',
    manufacturer: 'HealthGuard Pharma',
    barcode: '1234567890128',
    categoryName: 'Antibiotics',
    expiryDate: '2025-08-31',
    batchNumber: 'CH2024003',
    images: []
  },

  // Vitamins
  {
    name: 'Vitamin C 1000mg',
    sku: 'VIT-001',
    description: 'Immune system support and antioxidant protection.',
    price: 12.99,
    stockQuantity: 300,
    reorderLevel: 60,
    unit: 'bottle',
    status: 'active',
    brand: 'VitaBoost',
    manufacturer: 'VitaBoost Nutrition',
    barcode: '1234567890129',
    categoryName: 'Vitamins',
    images: []
  },
  {
    name: 'Multivitamin Complex',
    sku: 'VIT-002',
    description: 'Complete daily multivitamin with minerals.',
    price: 19.99,
    stockQuantity: 250,
    reorderLevel: 50,
    unit: 'bottle',
    status: 'active',
    brand: 'DailyVita',
    manufacturer: 'Nutrition Labs',
    barcode: '1234567890130',
    categoryName: 'Vitamins',
    images: []
  },
  {
    name: 'Vitamin D3 5000IU',
    sku: 'VIT-003',
    description: 'Supports bone health and immune function.',
    price: 14.99,
    stockQuantity: 0,
    reorderLevel: 40,
    unit: 'bottle',
    status: 'active',
    brand: 'SunVita',
    manufacturer: 'SunVita Health',
    barcode: '1234567890131',
    categoryName: 'Vitamins',
    images: []
  },

  // First Aid
  {
    name: 'Adhesive Bandages Pack',
    sku: 'FA-001',
    description: 'Assorted sizes sterile adhesive bandages.',
    price: 4.99,
    stockQuantity: 400,
    reorderLevel: 80,
    unit: 'pack',
    status: 'active',
    brand: 'QuickHeal',
    manufacturer: 'Medical Supplies Co',
    barcode: '1234567890132',
    categoryName: 'First Aid',
    images: []
  },
  {
    name: 'Antiseptic Solution 100ml',
    sku: 'FA-002',
    description: 'Disinfectant for wound cleaning.',
    price: 6.99,
    stockQuantity: 200,
    reorderLevel: 40,
    unit: 'bottle',
    status: 'active',
    brand: 'CleanWound',
    manufacturer: 'Antiseptic Solutions Ltd',
    barcode: '1234567890133',
    categoryName: 'First Aid',
    images: []
  },
  {
    name: 'Medical Gauze Roll',
    sku: 'FA-003',
    description: 'Sterile gauze for wound dressing.',
    price: 3.99,
    stockQuantity: 300,
    reorderLevel: 60,
    unit: 'roll',
    status: 'active',
    brand: 'SterileWrap',
    manufacturer: 'Medical Textiles Inc',
    barcode: '1234567890134',
    categoryName: 'First Aid',
    images: []
  },

  // Cold & Flu
  {
    name: 'Cough Syrup 200ml',
    sku: 'CF-001',
    description: 'Relieves cough and soothes throat irritation.',
    price: 9.99,
    stockQuantity: 150,
    reorderLevel: 30,
    unit: 'bottle',
    status: 'active',
    brand: 'CoughRelief',
    manufacturer: 'Respiratory Care Pharma',
    barcode: '1234567890135',
    categoryName: 'Cold & Flu',
    expiryDate: '2025-06-30',
    batchNumber: 'CS2024001',
    images: []
  },
  {
    name: 'Nasal Decongestant Spray',
    sku: 'CF-002',
    description: 'Fast relief from nasal congestion.',
    price: 7.99,
    stockQuantity: 100,
    reorderLevel: 20,
    unit: 'bottle',
    status: 'active',
    brand: 'BreatheEasy',
    manufacturer: 'Nasal Care Solutions',
    barcode: '1234567890136',
    categoryName: 'Cold & Flu',
    expiryDate: '2025-09-30',
    batchNumber: 'NS2024002',
    images: []
  },
  {
    name: 'Throat Lozenges',
    sku: 'CF-003',
    description: 'Soothes sore throat and provides relief.',
    price: 5.49,
    stockQuantity: 12,
    reorderLevel: 50,
    unit: 'pack',
    status: 'active',
    brand: 'ThroatComfort',
    manufacturer: 'Comfort Pharma',
    barcode: '1234567890137',
    categoryName: 'Cold & Flu',
    images: []
  },

  // Medical Devices
  {
    name: 'Digital Thermometer',
    sku: 'DEV-001',
    description: 'Fast and accurate temperature measurement.',
    price: 19.99,
    stockQuantity: 50,
    reorderLevel: 10,
    unit: 'piece',
    status: 'active',
    brand: 'TempCheck',
    manufacturer: 'Medical Instruments Corp',
    barcode: '1234567890138',
    categoryName: 'Medical Devices',
    images: []
  },
  {
    name: 'Blood Pressure Monitor',
    sku: 'DEV-002',
    description: 'Automatic digital blood pressure monitor.',
    price: 49.99,
    stockQuantity: 25,
    reorderLevel: 5,
    unit: 'piece',
    status: 'active',
    brand: 'HeartGuard',
    manufacturer: 'Cardiac Care Devices',
    barcode: '1234567890139',
    categoryName: 'Medical Devices',
    images: []
  },
  {
    name: 'Pulse Oximeter',
    sku: 'DEV-003',
    description: 'Measures oxygen saturation and pulse rate.',
    price: 29.99,
    stockQuantity: 0,
    reorderLevel: 8,
    unit: 'piece',
    status: 'inactive',
    brand: 'OxyCheck',
    manufacturer: 'Vital Signs Tech',
    barcode: '1234567890140',
    categoryName: 'Medical Devices',
    images: []
  },

  // Digestive Health
  {
    name: 'Antacid Tablets',
    sku: 'DIG-001',
    description: 'Fast relief from heartburn and acid indigestion.',
    price: 8.99,
    stockQuantity: 200,
    reorderLevel: 40,
    unit: 'bottle',
    status: 'active',
    brand: 'AcidRelief',
    manufacturer: 'Digestive Care Labs',
    barcode: '1234567890141',
    categoryName: 'Digestive Health',
    images: []
  },
  {
    name: 'Probiotic Capsules',
    sku: 'DIG-002',
    description: 'Supports digestive health and immune system.',
    price: 24.99,
    stockQuantity: 120,
    reorderLevel: 25,
    unit: 'bottle',
    status: 'active',
    brand: 'BioBalance',
    manufacturer: 'Probiotic Sciences',
    barcode: '1234567890142',
    categoryName: 'Digestive Health',
    images: []
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