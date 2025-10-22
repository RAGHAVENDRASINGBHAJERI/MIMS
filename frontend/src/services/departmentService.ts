// Using fetch instead of axios for better compatibility

export interface Department {
  _id: string;
  name: string;
  type: 'Major' | 'Academic' | 'Service';
  createdAt: string;
}

const API_BASE_URL = 'https://mims-1.onrender.com';

export const departmentService = {
  // Get all departments
  getAllDepartments: async (): Promise<Department[]> => {
    try {
      console.log('Fetching departments from:', `${API_BASE_URL}/api/departments`);
      const token = sessionStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/departments`, { headers });
      const result = await response.json();

      if (!response.ok) {
        console.error('Department fetch failed:', result);
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Departments fetched successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by ID
  getDepartmentById: async (id: string): Promise<Department> => {
    const response = await fetch(`${API_BASE_URL}/api/departments/${id}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    
    return result.data;
  },

  // Create new department
  createDepartment: async (department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    const response = await fetch(`${API_BASE_URL}/api/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(department),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    
    return result.data;
  },
};