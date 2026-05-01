// Authentication
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  assignedZones?: string[]; // Danh sách phường KTV phụ trách
}

// Technician Zone
export interface TechnicianZoneDto {
  id: string;
  technicianId: string;
  technicianName: string;
  wardName: string;
  district: string;
  province: string;
  assignedAt: string;
}

export interface TechnicianZoneSummaryDto {
  technicianId: string;
  wardNames: string[];
  wardCount: number;
}

export interface UpdateTechnicianZonesDto {
  wardNames: string[];
}

/// Danh sách 10 phường TP. Cao Lãnh
export const CAO_LANH_WARDS = [
  'Phường 1',
  'Phường 2',
  'Phường 3',
  'Phường 4',
  'Phường 6',
  'Phường 11',
  'Mỹ Phú',
  'Tân Thuận Đông',
  'Hòa Thuận',
  'Mỹ Ngãi',
] as const;


export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface ProductFilter {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isLowStock?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// Dashboard
export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalWarehouses: number;
  totalUsers: number;
  pendingRepairs: number;
  todayImportsCount: number;
  todayExportsCount: number;
  totalInventoryValue: number;
  lowStockCount: number;
  repairStats: {
    pending: number;
    repairing: number;
    completed: number;
    unrepairable: number;
  };
  recentActivities: RecentActivity[];
  categoryStats: CategoryDistribution[];
  riskForecasts: StockForecast[];
}

export interface CategoryDistribution {
  name: string;
  count: number;
  value: number;
}

export interface StockForecast {
  productId: string;
  productName: string;
  quantity: number;
  daysRemaining: number | null;
  consumptionRate: number;
}

export interface RecentActivity {
  title: string;
  message: string;
  createdAt: string;
  type: 'Import' | 'Export' | 'Repair' | 'Notification';
}

export interface MonthlyStats {
  year: number;
  month: number;
  monthLabel: string;
  importCount: number;
  importAmount: number;
  exportCount: number;
}

// Products
export interface Category {
  id: string;
  categoryName: string;
  description?: string;
}

export interface Brand {
  id: string;
  brandName: string;
  logo?: string;
}

export interface Product {
  id: string;
  productName: string;
  categoryId: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  price: number;
  image?: string;
  description?: string;
  isLowStock: boolean;
  faultyQuantity: number;
  eManualUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// Repairs
export const RepairStatus = {
  Pending: 0,
  Repairing: 1,
  Completed: 2,
  Unrepairable: 3
} as const;

export type RepairStatusType = (typeof RepairStatus)[keyof typeof RepairStatus];
// For compatibility with codebase using RepairStatus as a type
export type RepairStatus = RepairStatusType;

export interface Repair {
  id: string;
  productId: string;
  productName?: string;
  technicianId: string;
  technicianFullName?: string;
  problem?: string;
  repairNote?: string;
  cost?: number;
  imageBefore?: string;
  imageAfter?: string;
  status: RepairStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RepairFilter {
  productId?: string;
  technicianId?: string;
  status?: RepairStatus;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

// Service Requests
export const ServiceStatus = {
  Pending: 0,
  Approved: 1,
  Assigned: 2,
  Completed: 3,
  Cancelled: 4
} as const;

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export interface ServiceRequest {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  serviceType: string;
  selectedPackage?: string;
  description?: string;
  status: ServiceStatus;
  adminNote?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  processedById?: string;
  processedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceRequestFilter {
  search?: string;
  status?: ServiceStatus;
  assignedTechnicianId?: string;
  pageNumber?: number;
  pageSize?: number;
}

// Retrievals
export interface RetrievalReceipt {
  id: string;
  receiptCode: string;
  warehouseId: string;
  warehouseName: string;
  technicianId: string;
  technicianName: string;
  retrievalDate: string;
  note?: string;
  status: number;
  details: RetrievalDetail[];
}

export interface RetrievalDetail {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  condition?: string;
  serialNumbers?: string[];
}

export interface CreateRetrieval {
  warehouseId: string;
  technicianId: string;
  note?: string;
  details: CreateRetrievalDetail[];
}

export interface CreateRetrievalDetail {
  productId: string;
  quantity: number;
  condition?: string;
  serialNumbers?: string[];
}

export interface RetrievalFilter {
  warehouseId?: string;
  technicianId?: string;
  search?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}
