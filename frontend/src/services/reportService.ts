// Using fetch instead of axios for better compatibility

export interface ReportFilters {
  academicYear?: string;
  departmentId?: string;
  itemName?: string;
  vendorName?: string;
  type?: 'capital' | 'revenue';
  startDate?: string;
  endDate?: string;
}

export interface ReportData {
  assets: {
    assets: any[];
    limit?: number;
  };
  summary: {
    totalCapital: number;
    totalRevenue: number;
    grandTotal: number;
    itemCount: number;
  };
}

const API_BASE_URL = 'http://localhost:5000';

export const reportService = {
  // Get department report
  getDepartmentReport: async (filters?: ReportFilters): Promise<{ report: any[] }> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (filters?.departmentId) {
      params.append('departmentId', filters.departmentId);
    }

    const response = await fetch(`${API_BASE_URL}/api/reports/department?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Get vendor report
  getVendorReport: async (filters?: ReportFilters): Promise<{ report: any[] }> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (filters?.vendorName) {
      params.append('vendorName', filters.vendorName);
    }

    const response = await fetch(`${API_BASE_URL}/api/reports/vendor?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Get item report
  getItemReport: async (filters?: ReportFilters): Promise<{ report: any[] }> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (filters?.itemName) {
      params.append('itemName', filters.itemName);
    }

    const response = await fetch(`${API_BASE_URL}/api/reports/item?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Get year report
  getYearReport: async (): Promise<{ report: any[] }> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/reports/year`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Generate report with filters
  generateReport: async (filters: ReportFilters): Promise<ReportData> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'academicYear') params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/api/reports?${params}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Export report to Excel
  exportToExcel: async (type: string = 'all', filters: Record<string, string> = {}): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    params.append('type', type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/export/excel?${params.toString()}`, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  // Export report to Word
  exportToWord: async (type: string = 'all'): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/reports/export/word?type=${type}`, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },
};
