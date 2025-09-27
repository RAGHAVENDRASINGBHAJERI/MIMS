import api from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export const departmentService = {
  // Get all departments
  getAllDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/api/departments');
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (id: string): Promise<Department> => {
    const response = await api.get(`/api/departments/${id}`);
    return response.data;
  },

  // Create new department
  createDepartment: async (department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    const response = await api.post('/api/departments', department);
    return response.data;
  },
};