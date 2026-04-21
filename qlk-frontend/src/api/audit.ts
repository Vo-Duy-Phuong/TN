import apiClient from './client';
import type { PaginatedResponse } from '../types';

export interface AuditLog {
  id: string;
  userId?: string;
  userFullName?: string;
  action: string;
  entityName: string;
  entityId: string;
  changes?: string;
  remoteIpAddress?: string;
  timestamp: string;
}

export const auditApi = {
  getLogs: async (pageNumber = 1, pageSize = 50) => {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>('/AuditLogs', {
      params: { pageNumber, pageSize }
    });
    return response.data;
  }
};
