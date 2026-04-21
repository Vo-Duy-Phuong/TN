import apiClient from './client';

export interface ExportDetail {
  productId: string;
  productName?: string;
  unit?: string;
  quantity: number;
  equipments?: any[];
}

export interface ExportReceipt {
  id: string;
  receiptCode: string;
  warehouseId: string;
  warehouseName?: string;
  technicianId: string;
  technicianFullName?: string;
  exportDate: string;
  exportFile?: string;
  note?: string;
  status: number;
  statusLabel: string;
  details: ExportDetail[];
}

export interface ExportFilter {
  warehouseId?: string;
  technicianId?: string;
  search?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateExportDto {
  warehouseId: string;
  technicianId: string;
  note?: string;
  details: {
    productId: string;
    quantity: number;
    serialNumbers?: string[];
  }[];
}

export const exportApi = {
  getAll: async (filter?: ExportFilter) => {
    const response = await apiClient.get<{ items: ExportReceipt[]; totalCount: number }>(
      '/Exports',
      { params: filter }
    );
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ExportReceipt>(`/Exports/${id}`);
    return response.data;
  },
  create: async (data: CreateExportDto) => {
    const response = await apiClient.post<ExportReceipt>('/Exports', data);
    return response.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/Exports/${id}`);
  },
};
