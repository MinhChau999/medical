import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CategoryAttributes {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  orderIndex: number;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'orderIndex' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public icon?: string;
  public color?: string;
  public parentId?: string;
  public orderIndex!: number;
  public status!: 'active' | 'inactive';
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Associations
  public readonly parent?: Category;
  public readonly children?: Category[];
}

Category.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true
  }
);

// Self-referencing associations
Category.hasMany(Category, {
  foreignKey: 'parentId',
  as: 'children'
});

Category.belongsTo(Category, {
  foreignKey: 'parentId',
  as: 'parent'
});