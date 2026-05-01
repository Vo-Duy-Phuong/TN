import apiClient from './client';
import type { TechnicianZoneSummaryDto, UpdateTechnicianZonesDto, TechnicianZoneDto } from '../types';

export const technicianZoneApi = {
  /**
   * Lấy toàn bộ phân công tuyến (Admin/Manager view)
   */
  getAll: async (): Promise<TechnicianZoneDto[]> => {
    const response = await apiClient.get<TechnicianZoneDto[]>('/TechnicianZones');
    return response.data;
  },

  /**
   * Lấy danh sách phường của 1 kỹ thuật viên
   */
  getByTechnician: async (technicianId: string): Promise<TechnicianZoneSummaryDto> => {
    const response = await apiClient.get<TechnicianZoneSummaryDto>(`/TechnicianZones/${technicianId}`);
    return response.data;
  },

  /**
   * Cập nhật toàn bộ tuyến phường cho 1 kỹ thuật viên
   */
  updateZones: async (technicianId: string, dto: UpdateTechnicianZonesDto): Promise<TechnicianZoneSummaryDto> => {
    const response = await apiClient.put<TechnicianZoneSummaryDto>(`/TechnicianZones/${technicianId}`, dto);
    return response.data;
  },


  /**
   * Lấy danh sách KTV phụ trách 1 phường
   */
  getByWard: async (wardName: string): Promise<TechnicianZoneDto[]> => {
    const response = await apiClient.get<TechnicianZoneDto[]>(`/TechnicianZones/ward/${encodeURIComponent(wardName)}`);
    return response.data;
  },

  /**
   * Lấy summary phân công cho nhiều KTV (batch)
   */
  getSummaryBatch: async (technicianIds: string[]): Promise<TechnicianZoneSummaryDto[]> => {
    if (technicianIds.length === 0) return [];
    const params = new URLSearchParams();
    technicianIds.forEach(id => params.append('ids', id));
    const response = await apiClient.get<TechnicianZoneSummaryDto[]>('/TechnicianZones/summary', { params });
    return response.data;
  },
};

