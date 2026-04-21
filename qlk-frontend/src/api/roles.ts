import apiClient from './client';
import type { Role } from '../types';

export interface RoleFilter {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const roleApi = {
  getRoles: async (params: RoleFilter) => {
    const response = await apiClient.get<Role[]>('/Roles', { params });
    const totalCount = parseInt(response.headers['x-total-count'] || '0');
    return {
      items: response.data,
      totalCount
    };
  },
  
  getAll: async () => {
    const response = await apiClient.get<Role[]>('/Roles');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Role>(`/Roles/${id}`);
    return response.data;
  }
};
