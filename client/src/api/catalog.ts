import apiClient from './client';
import type { BookingUnit, Category, Service } from '../types/catalog';

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/categories');
  return res.data;
}

export async function getServices(categoryId?: string): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services', {
    params: categoryId ? { categoryId } : undefined,
  });
  return res.data;
}

export async function getServiceById(id: string): Promise<Service> {
  const res = await apiClient.get<Service>(`/services/${id}`);
  return res.data;
}

export async function getMyServices(): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services/mine');
  return res.data;
}

export interface ServiceRequest {
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  bookingUnit: BookingUnit;
}

export async function createService(data: ServiceRequest): Promise<Service> {
  const res = await apiClient.post<Service>('/services', data);
  return res.data;
}

export async function toggleServiceActive(id: string): Promise<Service> {
  const res = await apiClient.patch<Service>(`/services/${id}/toggle-active`);
  return res.data;
}
export interface CategoryRequest {
  name: string;
  description: string | null;
}

export async function createCategory(data: CategoryRequest): Promise<Category> {
  const res = await apiClient.post<Category>('/categories', data);
  return res.data;
}

export async function updateCategory(id: string, data: CategoryRequest): Promise<Category> {
  const res = await apiClient.put<Category>(`/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/categories/all');
  return res.data;
}

export async function toggleCategoryActive(id: string): Promise<Category> {
  const res = await apiClient.patch<Category>(`/categories/${id}/toggle-active`);
  return res.data;
}