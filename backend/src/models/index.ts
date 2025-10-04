import { Category } from './category.model';
import { Product } from './product.model';
import HomepageSettings from './homepage.model';

// Initialize models
export function initializeModels() {
  Category.initModel();
  Product.initModel();
  // HomepageSettings doesn't need initModel() - it uses sequelize.define pattern

  // Setup associations after all models are initialized
  Category.setupAssociations();
  Product.setupAssociations();
}

export { Category, Product, HomepageSettings };