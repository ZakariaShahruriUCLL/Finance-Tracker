import api from './client';
import type { Category } from '../types';

interface CategoryListResponse { categories: Category[] }
interface CategoryResponse { category: Category }

export const categoriesApi = {
  list: () => api.get<CategoryListResponse>('/categories'),
  create: (data: { name: string; color?: string; icon?: string | null }) =>
    api.post<CategoryResponse>('/categories', data),
  update: (id: string, data: { name?: string; color?: string; icon?: string | null }) =>
    api.put<CategoryResponse>(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
};
