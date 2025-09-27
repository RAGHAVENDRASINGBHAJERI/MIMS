import api from './api';

export interface Asset {
  id: string;
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
  departmentId: string;
  categoryId: string;
  type: 'capital' | 'revenue';
  fileUrl?: string;
  createdAt: string;
}

export interface AssetFormData {
  itemName: string;
  quantity: number;
  pricePerItem: number;
  vendorName: string;
  vendorAddress: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string;
  departmentId: string;
  categoryId: string;
  type: 'capital' | 'revenue';
  file?: File;
}

export interface AssetListResponse {
  assets: Asset[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const assetService = {
  // Get all assets with pagination
  getAssets: async (page = 1, limit = 10, type?: string): Promise<AssetListResponse> => {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString(),
      ...(type && { type })
    });
    const response = await api.get(`/api/assets?${params}`);
    return response.data;
  },

  // Create new asset
  createAsset: async (assetData: AssetFormData): Promise<Asset> => {
    const formData = new FormData();
    
    Object.entries(assetData).forEach(([key, value]) => {
      if (key === 'file' && value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await api.post('/api/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get asset by ID
  getAssetById: async (id: string): Promise<Asset> => {
    const response = await api.get(`/api/assets/${id}`);
    return response.data;
  },

  // Update asset
  updateAsset: async (id: string, assetData: Partial<AssetFormData>): Promise<Asset> => {
    const response = await api.put(`/api/assets/${id}`, assetData);
    return response.data;
  },

  // Delete asset
  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/api/assets/${id}`);
  },
};