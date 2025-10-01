import { Category } from './category.model';
import { Product } from './product.model';

// Initialize models
export function initializeModels() {
  Category.initModel();
  Product.initModel();

  // Setup associations after all models are initialized
  Category.setupAssociations();
  Product.setupAssociations();
}

export { Category, Product };