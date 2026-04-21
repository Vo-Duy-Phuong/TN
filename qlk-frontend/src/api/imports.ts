import apiClient from './client';

export interface ImportDetail {
  productId: string;
  productName?: string;
  unit?: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  equipments?: any[]; // To match backend response
}

export interface ImportReceipt {
  id: string;
  receiptCode: string;
  warehouseId: string;
  warehouseName?: string;
  createdBy: string;
  creatorFullName?: string;
  importDate: string;
  invoiceFile?: string;
  note?: string;
  status: number;
  statusLabel: string;
  totalAmount: number;
  details: ImportDetail[];
}

export interface ImportFilter {
  warehouseId?: string;
  search?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateImportDto {
  warehouseId: string;
  createdBy: string;
  note?: string;
  details: {
    productId: string;
    quantity: number;
    price: number;
    serialNumbers?: string[];
    macAddresses?: string[];
    warrantyMonths?: number;
  }[];
}

export const importApi = {
  create: async (data: CreateImportDto) => {
    const response = await apiClient.post('/Imports', data);
    return response.data;
  },
  getAll: async (filter?: ImportFilter) => {
    const response = await apiClient.get<{ items: ImportReceipt[], totalCount: number }>('/Imports', { params: filter });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/Imports/${id}`);
    return response.data as ImportReceipt;
  }
};
