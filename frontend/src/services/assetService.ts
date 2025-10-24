// Using fetch instead of axios for better compatibility

export interface Asset {
  _id: string;
  itemName: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  items?: Array<{
    particulars: string;
    quantity: number;
    rate: number;
    cgst: number;
    sgst: number;
    amount: number;
    grandTotal: number;
  }>;
  vendorName: string;
  vendorAddress: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string;
  department: {
    _id: string;
    name: string;
    type: string;
  };
  category: string;
  type: 'capital' | 'revenue';
  billFileId: string;
  createdAt: string;
}

export interface AssetFormData {
  itemName?: string;
  quantity?: number;
  pricePerItem?: number;
  vendorName: string;
  vendorAddress: string;
  contactNumber: string;
  email: string;
  billNo: string;
  billDate: string;
  department: string;
  category: string;
  type?: 'capital' | 'revenue';
  billFile?: File;
  collegeISRNo?: string;
  itISRNo?: string;
  igst?: number;
  cgst?: number;
  sgst?: number;
  grandTotal?: number;
  remark?: string;
  reason?: string;
  officerName?: string;
  items?: Array<{
    particulars: string;
    quantity: number;
    rate: number;
    cgst: number;
    sgst: number;
    amount?: number;
    grandTotal?: number;
  }>;
}

export interface AssetListResponse {
  assets: Asset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalAssets: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const assetService = {
  // Get all assets
  getAssets: async (params?: {
    departmentId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AssetListResponse> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/api/assets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Create new asset
  createAsset: async (assetData: AssetFormData): Promise<Asset> => {
    console.log('Creating asset with data:', assetData);

    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();

    Object.entries(assetData).forEach(([key, value]) => {
      if (key === 'billFile' && value instanceof File) {
        console.log('Adding file to FormData:', key, value.name, value.size);
        formData.append('billFile', value);
      } else if (key === 'items' && Array.isArray(value)) {
        formData.append('items', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        console.log('Adding field to FormData:', key, value);
        formData.append(key, value.toString());
      }
    });

    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    console.log('Making request to:', `${API_BASE_URL}/api/assets`);

    const response = await fetch(`${API_BASE_URL}/api/assets`, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      console.error('Asset creation failed:', result);
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Get asset by ID
  getAssetById: async (id: string): Promise<Asset> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Update asset
  updateAsset: async (id: string, assetData: Partial<AssetFormData>, reason?: string, officerName?: string): Promise<Asset> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();

    // Add reason and officerName if provided
    if (reason) formData.append('reason', reason);
    if (officerName) formData.append('officerName', officerName);

    Object.entries(assetData).forEach(([key, value]) => {
      if (key === 'billFile' && value instanceof File) {
        formData.append('billFile', value);
      } else if (key === 'items' && Array.isArray(value)) {
        formData.append('items', JSON.stringify(value));
      } else if (value !== undefined && value !== null && key !== 'reason' && key !== 'officerName') {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Delete asset
  deleteAsset: async (id: string, reason: string, officerName?: string): Promise<void> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ reason, officerName }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
  },

  // Preview bill file
  previewBill: async (id: string): Promise<Blob> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/assets/${id}/preview`, { headers });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },
};
