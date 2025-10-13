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
  const response = await api.get('/admin/users');
  return response.data.data;
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}): Promise<User> => {
  const response = await api.post('/admin/users', userData);
  return response.data.data;
};

export const updateUser = async (id: string, userData: {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
}): Promise<User> => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

// Department management
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/admin/departments');
  return response.data.data;
};

export const createDepartment = async (departmentData: {
  name: string;
  type: string;
}): Promise<Department> => {
  const response = await api.post('/admin/departments', departmentData);
  return response.data.data;
};

export const updateDepartment = async (id: string, departmentData: {
  name?: string;
  type?: string;
}): Promise<Department> => {
  const response = await api.put(`/admin/departments/${id}`, departmentData);
  return response.data.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/admin/departments/${id}`);
};

// Asset management
export const getAllAssets = async (): Promise<Asset[]> => {
  const response = await api.get('/admin/assets');
  return response.data.data;
};

export const createAsset = async (formData: FormData): Promise<Asset> => {
  const response = await api.post('/admin/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const updateAsset = async (id: string, formData: FormData): Promise<Asset> => {
  const response = await api.put(`/admin/assets/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await api.delete(`/admin/assets/${id}`);
};

// Data seeding
export const seedData = async (): Promise<{ message: string }> => {
  const response = await api.post('/admin/seed');
  return response.data;
};
