import apiClient from './client';
import type { User } from '../types';

export interface UserFilter {
  search?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const userApi = {
  getUsers: async (params: UserFilter) => {
    const response = await apiClient.get<User[]>('/Users', { params });
    const totalCount = parseInt(response.headers['x-total-count'] || '0');
    return {
      items: response.data,
      totalCount
    };
  },
  
  getAll: async () => {
    const response = await apiClient.get<User[]>('/Users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<User>(`/Users/${id}`);
    return response.data;
  },

  create: async (formData: FormData) => {
    const response = await apiClient.post<User>('/Users', formData);
    return response.data;
  },

  update: async (id: string, formData: FormData) => {
    await apiClient.put(`/Users/${id}`, formData);
  },

  delete: async (id: string) => {
    await apiClient.delete(`/Users/${id}`);
  },

  updatePassword: async (id: string, newPassword: string) => {
    await apiClient.patch(`/Users/${id}/password`, JSON.stringify(newPassword), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Aliases for SettingsPage
  updateProfile: async (id: string, data: any) => {
    // Convert DTO to FormData if needed, but SettingsPage sends object
    // Assuming backend endpoint /Users/{id} handles UpdateUserDto as JSON 
    // or we use the existing update method logic.
    await apiClient.put(`/Users/${id}`, data);
  },

  changePassword: async (id: string, newPassword: string) => {
    await userApi.updatePassword(id, newPassword);
  }
};
