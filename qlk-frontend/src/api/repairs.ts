import apiClient from './client';
import type { Repair, RepairFilter, PaginatedResponse } from '../types';

export const repairApi = {
  getRepairs: async (params: RepairFilter) => {
    const response = await apiClient.get<PaginatedResponse<Repair>>('/Repairs', { params });
    return response.data;
  },

  getRepair: async (id: string) => {
    const response = await apiClient.get<Repair>(`/Repairs/${id}`);
    return response.data;
  },

  createRepair: async (formData: FormData) => {
    const response = await apiClient.post<Repair>('/Repairs', formData);
    return response.data;
  },

  updateRepair: async (id: string, formData: FormData) => {
    await apiClient.put(`/Repairs/${id}`, formData);
  },

  deleteRepair: async (id: string) => {
    await apiClient.delete(`/Repairs/${id}`);
  }
};
