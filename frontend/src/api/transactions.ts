import api from './client';
import type { Transaction, TransactionListResponse, Summary, TransactionFormData, CategoryBreakdownItem, Balance } from '../types';

interface TransactionResponse { transaction: Transaction }

export const transactionsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<TransactionListResponse>('/transactions', { params }),
  summary: (params?: { month?: number; year?: number }) =>
    api.get<Summary>('/transactions/summary', { params }),
  create: (data: TransactionFormData) =>
    api.post<TransactionResponse>('/transactions', data),
  update: (id: string, data: Partial<TransactionFormData>) =>
    api.put<TransactionResponse>(`/transactions/${id}`, data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
  balance: () => api.get<Balance>('/transactions/balance'),
  categoryBreakdown: (params?: { month?: number; year?: number }) =>
    api.get<CategoryBreakdownItem[]>('/transactions/category-breakdown', { params }),
};
