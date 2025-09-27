import api from './api';

export interface Category {
  id: string;
  name: string;
  type: 'capital' | 'revenue';
  description?: string;
  createdAt: string;
}

export const categoryService = {
  // Get all categories
  getAllCategories: async (type?: 'capital' | 'revenue'): Promise<Category[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/api/categories${params}`);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await api.get(`/api/categories/${id}`);
    return response.data;
  },

  // Create new category
  createCategory: async (category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
    const response = await api.post('/api/categories', category);
    return response.data;
  },
};