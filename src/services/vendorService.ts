import api from './api';

export interface Vendor {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  createdAt: string;
}

export const vendorService = {
  // Get all vendors
  getAllVendors: async (): Promise<Vendor[]> => {
    const response = await api.get('/api/vendors');
    return response.data;
  },

  // Search vendors by name
  searchVendors: async (query: string): Promise<Vendor[]> => {
    const response = await api.get(`/api/vendors/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Create new vendor
  createVendor: async (vendor: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> => {
    const response = await api.post('/api/vendors', vendor);
    return response.data;
  },
};