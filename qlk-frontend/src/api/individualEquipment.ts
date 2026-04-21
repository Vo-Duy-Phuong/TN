import axiosInstance from './client';

export interface EquipmentPublicLookupDto {
  serialNumber: string;
  macAddress: string;
  productName: string;
  productCategory: string;
  statusLabel: string;
  isActive: boolean;
  warrantyExpiry?: string;
  isUnderWarranty: boolean;
  eManualUrl?: string;
  installationDate?: string;
}

export interface IndividualEquipmentSummaryDto {
  id: string;
  serialNumber: string;
  macAddress: string;
  status: number;
  statusLabel: string;
  warrantyExpiry?: string;
  isUnderWarranty: boolean;
}

export const equipmentApi = {
  lookup: async (query: string) => {
    const response = await axiosInstance.get<EquipmentPublicLookupDto>('/Equipment/lookup', {
      params: { query }
    });
    return response.data;
  },

  getByProduct: async (productId: string, warehouseId?: string, status?: number) => {
    const response = await axiosInstance.get<IndividualEquipmentSummaryDto[]>(`/Equipment/product/${productId}`, {
      params: { warehouseId, status }
    });
    return response.data;
  }
};
