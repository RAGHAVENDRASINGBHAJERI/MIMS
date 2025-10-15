import api from './api';

export interface Category {
  id: string;
  name: string;
  type: 'capital' | 'revenue' | 'consumable';
  description?: string;
  createdAt: string;
}

// Hardcoded categories since backend doesn't have categories endpoint
const capitalCategories = [
  { id: '1', name: 'Computer Equipment', type: 'capital' as const, description: 'Computers, laptops, servers', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '2', name: 'Office Furniture', type: 'capital' as const, description: 'Desks, chairs, cabinets', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '3', name: 'Furnitures', type: 'capital' as const, description: 'General furniture items', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '4', name: 'Lab Equipment', type: 'capital' as const, description: 'Scientific instruments, lab tools', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '5', name: 'Audio/Visual Equipment', type: 'capital' as const, description: 'Projectors, speakers, cameras', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '6', name: 'Network Equipment', type: 'capital' as const, description: 'Routers, switches, cables', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '7', name: 'Maintenance Tools', type: 'capital' as const, description: 'Tools for maintenance work', createdAt: '2024-01-01T00:00:00.000Z' },
];

const consumableCategories = [
  { id: '17', name: 'Stationery', type: 'consumable' as const, description: 'Pens, paper, notebooks', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '18', name: 'Lab Consumables', type: 'consumable' as const, description: 'Chemicals, reagents, disposables', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '19', name: 'Office Supplies', type: 'consumable' as const, description: 'Printer ink, toner, office materials', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '20', name: 'Cleaning Supplies', type: 'consumable' as const, description: 'Cleaning materials and detergents', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '21', name: 'Maintenance Supplies', type: 'consumable' as const, description: 'Maintenance and repair materials', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '22', name: 'IT Consumables', type: 'consumable' as const, description: 'Cables, connectors, small IT parts', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '23', name: 'Safety Equipment', type: 'consumable' as const, description: 'Gloves, masks, safety gear', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '24', name: 'General Supplies', type: 'consumable' as const, description: 'Miscellaneous consumable items', createdAt: '2024-01-01T00:00:00.000Z' },
];

const revenueCategories = [
  { id: '8', name: 'Course Fees', type: 'revenue' as const, description: 'Student course fees', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '9', name: 'Lab Usage', type: 'revenue' as const, description: 'Laboratory usage charges', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '10', name: 'Equipment Rental', type: 'revenue' as const, description: 'Equipment rental income', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '11', name: 'Consultation Services', type: 'revenue' as const, description: 'Professional consultation fees', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '12', name: 'Training Programs', type: 'revenue' as const, description: 'Training and workshop fees', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '13', name: 'Research Projects', type: 'revenue' as const, description: 'Research project funding', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '14', name: 'Furniture', type: 'revenue' as const, description: 'Furniture items', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '15', name: 'IT/Computer', type: 'revenue' as const, description: 'IT and computer equipment', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '16', name: 'Equipment', type: 'revenue' as const, description: 'General equipment', createdAt: '2024-01-01T00:00:00.000Z' },
];

export const categoryService = {
  // Get all categories
  getAllCategories: async (type?: 'capital' | 'revenue' | 'consumable'): Promise<Category[]> => {
    if (type === 'capital') {
      return capitalCategories;
    } else if (type === 'revenue') {
      return revenueCategories;
    } else if (type === 'consumable') {
      return consumableCategories;
    }
    return [...capitalCategories, ...revenueCategories, ...consumableCategories];
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    const allCategories = [...capitalCategories, ...revenueCategories, ...consumableCategories];
    const category = allCategories.find(cat => cat.id === id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  },

  // Create new category (not implemented since using hardcoded)
  createCategory: async (category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
    throw new Error('Category creation not supported');
  },
};