import api from './api';

export interface Category {
  id: string;
  key?: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parent?: Category;
  children?: Category[];
  order?: number;
  status?: 'active' | 'inactive';
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  order?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

class CategoriesService {
  // Get all categories with tree structure
  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get single category by ID
  async getCategory(id: string): Promise<Category> {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Create new category
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await api.post('/categories', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Update categories order (for drag and drop)
  async updateCategoriesOrder(categories: { id: string; parentId?: string | null; order: number }[]): Promise<void> {
    try {
      await api.post('/categories/reorder', { categories });
    } catch (error) {
      console.error('Error updating categories order:', error);
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();