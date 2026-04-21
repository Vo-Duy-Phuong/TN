import apiClient from './client';
import type { DashboardStats, MonthlyStats } from '../types';

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get<DashboardStats>('/Dashboard');
    return response.data;
  },
  
  getMonthlyStats: async (months: number = 12) => {
    const response = await apiClient.get<MonthlyStats[]>(`/Dashboard/monthly-stats?months=${months}`);
    return response.data;
  },

  exportStats: async () => {
    const response = await apiClient.get('/Dashboard/export-stats', {
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcel: async () => {
    const response = await apiClient.get('/Dashboard/export-excel', {
      responseType: 'blob'
    });
    return response.data;
  },

  exportPdf: async () => {
    const response = await apiClient.get('/Dashboard/export-pdf', {
      responseType: 'blob'
    });
    return response.data;
  }
};


