import apiClient from './client';
import type { RetrievalReceipt, RetrievalFilter, CreateRetrieval, PaginatedResponse } from '../types';

export const retrievalApi = {
  create: async (data: CreateRetrieval) => {
    const response = await apiClient.post('/Retrievals', data);
    return response.data;
  },
  getAll: async (filter?: RetrievalFilter) => {
    const response = await apiClient.get<PaginatedResponse<RetrievalReceipt>>('/Retrievals', { params: filter });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<RetrievalReceipt>(`/Retrievals/${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/Retrievals/${id}`);
  }
};
