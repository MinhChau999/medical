import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Category } from './category.model';

interface ProductAttributes {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  unit?: string;
  status: 'active' | 'inactive';
  images?: string[];
  image?: string;
  brand?: string;
  barcode?: string;
  manufacturer?: string;
  expiryDate?: string;
  batchNumber?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public name!: string;
  public sku!: string;
  public description?: string;
  public categoryId?: string;
  public price!: number;
  public stockQuantity!: number;
  public reorderLevel!: number;
  public unit?: string;
  public status!: 'active' | 'inactive';
  public images?: string[];
  public image?: string;
  public brand?: string;
  public barcode?: string;
  public manufacturer?: string;
  public expiryDate?: string;
  public batchNumber?: string;
  public notes?: string;
  public createdBy?: string;
  public updatedBy?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly category?: Category;

  static initModel() {
    Product.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        sku: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'categories',
            key: 'id'
          }
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        stockQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        reorderLevel: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 10
        },
        unit: {
          type: DataTypes.STRING,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          defaultValue: 'active'
        },
        images: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: []
        },
        image: {
          type: DataTypes.STRING,
          allowNull: true
        },
        brand: {
          type: DataTypes.STRING,
          allowNull: true
        },
        barcode: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        },
        manufacturer: {
          type: DataTypes.STRING,
          allowNull: true
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: true
        },
        batchNumber: {
          type: DataTypes.STRING,
          allowNull: true
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true
        },
        updatedBy: {
          type: DataTypes.UUID,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Product',
        tableName: 'products',
        timestamps: true
      }
    );
  }

  static setupAssociations() {
    Product.belongsTo(Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
  }
}