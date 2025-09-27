import api from './api';

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
  assets: any[];
  summary: {
    totalCapital: number;
    totalRevenue: number;
    grandTotal: number;
    itemCount: number;
  };
}

export const reportService = {
  // Generate report with filters
  generateReport: async (filters: ReportFilters): Promise<ReportData> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/api/reports?${params}`);
    return response.data;
  },

  // Export report to Excel
  exportToExcel: async (filters: ReportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/api/reports/export/excel?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export report to Word
  exportToWord: async (filters: ReportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/api/reports/export/word?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};