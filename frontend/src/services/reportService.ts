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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const reportService = {
  // Get department report
  getDepartmentReport: async (filters?: ReportFilters): Promise<{ report: any[]; summary: any }> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value && value !== 'undefined' && key !== 'academicYear') params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/department?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
    }

    return {
      report: result.data?.assets || [],
      summary: result.data?.summary ? {
        totalCapital: result.data.summary.totalCapital || 0,
        totalRevenue: result.data.summary.totalRevenue || 0,
        grandTotal: result.data.summary.grandTotal || 0,
        itemCount: result.data.summary.itemCount || 0
      } : {
        totalCapital: 0,
        totalRevenue: 0,
        grandTotal: 0,
        itemCount: 0
      }
    };
  },

  // Get vendor report
  getVendorReport: async (filters?: ReportFilters): Promise<{ report: any[]; summary: any }> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value && value !== 'undefined' && key !== 'academicYear') params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/vendor?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
    }

    return {
      report: result.data?.report || [],
      summary: result.data?.summary ? {
        totalCapital: result.data.summary.totalCapital || 0,
        totalRevenue: result.data.summary.totalRevenue || 0,
        grandTotal: result.data.summary.grandTotal || 0,
        itemCount: result.data.summary.itemCount || 0
      } : {
        totalCapital: 0,
        totalRevenue: 0,
        grandTotal: 0,
        itemCount: 0
      }
    };
  },

  // Get item report
  getItemReport: async (filters?: ReportFilters): Promise<{ report: any[]; summary: any }> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value && value !== 'undefined' && key !== 'academicYear') params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/item?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
    }

    return {
      report: result.data?.report || [],
      summary: result.data?.summary ? {
        totalCapital: result.data.summary.totalCapital || 0,
        totalRevenue: result.data.summary.totalRevenue || 0,
        grandTotal: result.data.summary.grandTotal || 0,
        itemCount: result.data.summary.itemCount || 0
      } : {
        totalCapital: 0,
        totalRevenue: 0,
        grandTotal: 0,
        itemCount: 0
      }
    };
  },

  // Get year report
  getYearReport: async (filters?: ReportFilters): Promise<{ report: any[]; summary: any }> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value && value !== 'undefined' && key !== 'academicYear') params.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/year?${params.toString()}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
    }

    return {
      report: result.data.report,
      summary: {
        totalCapital: result.data.summary.totalCapital,
        totalRevenue: result.data.summary.totalRevenue,
        grandTotal: result.data.summary.grandTotal,
        itemCount: result.data.summary.itemCount
      }
    };
  },

  // Generate report with filters
  generateReport: async (filters: ReportFilters): Promise<ReportData> => {
    const token = sessionStorage.getItem('token');
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
      throw new Error(result.message || result.error || `HTTP error! status: ${response.status}`);
    }

    return result.data;
  },

  // Export report to Excel
  exportToExcel: async (type: string = 'combined', filters: Record<string, string> = {}): Promise<Blob> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    params.append('type', type);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'undefined') {
        params.append(key, value);
      }
    });

    console.log('Excel export params:', params.toString());
    const response = await fetch(`${API_BASE_URL}/api/reports/export/excel?${params.toString()}`, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Excel export error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  // Export report to Word
  exportToWord: async (type: string = 'all'): Promise<Blob> => {
    const token = sessionStorage.getItem('token');
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



  // Download bills as ZIP
  downloadBills: async (selectedAssetIds: string[], filters: ReportFilters = {}): Promise<Blob> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (selectedAssetIds.length > 0) {
      params.append('assetIds', selectedAssetIds.join(','));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'academicYear') {
        params.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/download/bills?${params.toString()}`, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  // Merge and download all filtered bills as single PDF
  downloadMergedBills: async (filters: ReportFilters = {}): Promise<Blob> => {
    const token = sessionStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'academicYear') {
        params.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/reports/download/merged-bills?${params.toString()}`, { headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },
};
