import apiClient from './client';
import type { Product, ProductFilter, PaginatedResponse, Category, Brand } from '../types';

export const productApi = {
  getProducts: async (params: ProductFilter) => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/Products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await apiClient.get<Product>(`/Products/${id}`);
    return response.data;
  },
  createProduct: async (formData: FormData) => {
    const response = await apiClient.post<Product>('/Products', formData);
    return response.data;
  },
  updateProduct: async (id: string, formData: FormData) => {
    await apiClient.put(`/Products/${id}`, formData);
  },
  deleteProduct: async (id: string) => {
    await apiClient.delete(`/Products/${id}`);
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get<Category[]>('/Categories');
    return response.data;
  },
  createCategory: async (data: { categoryName: string, description?: string }) => {
    const response = await apiClient.post<Category>('/Categories', data);
    return response.data;
  },
  updateCategory: async (id: string, data: { categoryName: string, description?: string }) => {
    await apiClient.put(`/Categories/${id}`, data);
  },
  deleteCategory: async (id: string) => {
    await apiClient.delete(`/Categories/${id}`);
  },

  // Brands
  getBrands: async () => {
    const response = await apiClient.get<Brand[]>('/Brands');
    return response.data;
  },
  createBrand: async (data: { brandName: string, logo?: string }) => {
    const response = await apiClient.post<Brand>('/Brands', data);
    return response.data;
  },
  updateBrand: async (id: string, data: { brandName: string, logo?: string }) => {
    await apiClient.put(`/Brands/${id}`, data);
  },
  deleteBrand: async (id: string) => {
    await apiClient.delete(`/Brands/${id}`);
  }
};
