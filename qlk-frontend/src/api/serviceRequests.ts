import apiClient from './client';
import type { ServiceRequest, ServiceRequestFilter } from '../types';

export const serviceRequestApi = {
  getRequests: async (params: ServiceRequestFilter) => {
    const response = await apiClient.get<ServiceRequest[]>('/ServiceRequests', { params });
    return response.data; // API returns ServiceRequest[] directly
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ServiceRequest>(`/ServiceRequests/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post<ServiceRequest>('/ServiceRequests', data);
    return response.data;
  },
  process: async (id: string, data: any) => {
    await apiClient.put(`/ServiceRequests/${id}/process`, data);
  },
  delete: async (id: string) => {
    await apiClient.delete(`/ServiceRequests/${id}`);
  },
  assignTechnician: async (id: string, technicianId: string) => {
    await apiClient.put(`/ServiceRequests/${id}/assign`, { technicianId });
  }
};
