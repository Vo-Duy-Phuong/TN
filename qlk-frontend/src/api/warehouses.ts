import apiClient from './client';

export interface Warehouse {
  id: string;
  warehouseName: string;
  location: string;
  managerId: string;
  managerName?: string;
}

export const warehouseApi = {
  getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string }) => {
    const response = await apiClient.get<{ items: Warehouse[], totalCount: number }>('/Warehouses', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<Warehouse>(`/Warehouses/${id}`);
    return response.data;
  },
  create: async (data: Omit<Warehouse, 'id' | 'managerName'>) => {
    const response = await apiClient.post<Warehouse>('/Warehouses', data);
    return response.data;
  },
  update: async (id: string, data: Omit<Warehouse, 'id' | 'managerName'>) => {
    const response = await apiClient.put(`/Warehouses/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/Warehouses/${id}`);
  }
};
