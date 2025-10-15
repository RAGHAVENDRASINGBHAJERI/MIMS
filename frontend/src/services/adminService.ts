import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface Asset {
  _id: string;
  department: {
    _id: string;
    name: string;
    type: string;
  };
  category: string;
  itemName: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  vendorName: string;
  vendorAddress: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string;
  type: string;
  createdAt: string;
}

// User management
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/api/admin/users');
  return response.data.data;
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}): Promise<User> => {
  const response = await api.post('/api/admin/users', userData);
  return response.data.data;
};

export const updateUser = async (id: string, userData: {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
}): Promise<User> => {
  const response = await api.put(`/api/admin/users/${id}`, userData);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/users/${id}`);
};

// Department management
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/api/admin/departments');
  return response.data.data;
};

export const createDepartment = async (departmentData: {
  name: string;
  type: string;
}): Promise<Department> => {
  const response = await api.post('/api/admin/departments', departmentData);
  return response.data.data;
};

export const updateDepartment = async (id: string, departmentData: {
  name?: string;
  type?: string;
}): Promise<Department> => {
  const response = await api.put(`/api/admin/departments/${id}`, departmentData);
  return response.data.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/departments/${id}`);
};

// Asset management
export const getAllAssets = async (): Promise<Asset[]> => {
  const response = await api.get('/api/admin/assets');
  return response.data.data.assets;
};

export const createAsset = async (formData: FormData): Promise<Asset> => {
  const response = await api.post('/api/admin/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const updateAsset = async (id: string, formData: FormData): Promise<Asset> => {
  const response = await api.put(`/api/admin/assets/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/assets/${id}`);
};

// Data seeding
export const seedData = async (): Promise<{ message: string }> => {
  const response = await api.post('/api/admin/seed');
  return response.data;
};
