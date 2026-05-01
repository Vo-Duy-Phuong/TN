import type { TechnicianZoneSummaryDto, UpdateTechnicianZonesDto, TechnicianZoneDto } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const technicianZoneApi = {
  /**
   * Lấy toàn bộ phân công tuyến (Admin/Manager view)
   */
  getAll: async (): Promise<TechnicianZoneDto[]> => {
    const res = await fetch(`${API_BASE}/technicianzones`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải dữ liệu phân công tuyến');
    return res.json();
  },

  /**
   * Lấy danh sách phường của 1 kỹ thuật viên
   */
  getByTechnician: async (technicianId: string): Promise<TechnicianZoneSummaryDto> => {
    const res = await fetch(`${API_BASE}/technicianzones/${technicianId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải tuyến của kỹ thuật viên');
    return res.json();
  },

  /**
   * Cập nhật toàn bộ tuyến phường cho 1 kỹ thuật viên
   */
  updateZones: async (technicianId: string, dto: UpdateTechnicianZonesDto): Promise<TechnicianZoneSummaryDto> => {
    const res = await fetch(`${API_BASE}/technicianzones/${technicianId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi Server (${res.status})`);
    }
    return res.json();
  },


  /**
   * Lấy danh sách KTV phụ trách 1 phường (dùng khi gán yêu cầu dịch vụ)
   */
  getByWard: async (wardName: string): Promise<TechnicianZoneDto[]> => {
    const res = await fetch(
      `${API_BASE}/technicianzones/ward/${encodeURIComponent(wardName)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error('Không thể tải KTV theo phường');
    return res.json();
  },

  /**
   * Lấy summary phân công cho nhiều KTV (batch, dùng cho User Card list)
   */
  getSummaryBatch: async (technicianIds: string[]): Promise<TechnicianZoneSummaryDto[]> => {
    if (technicianIds.length === 0) return [];
    const params = technicianIds.map(id => `ids=${id}`).join('&');
    const res = await fetch(`${API_BASE}/technicianzones/summary?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải summary tuyến');
    return res.json();
  },
};
