import api from './client';
import type { Transaction, TransactionListResponse, Summary, TransactionFormData, CategoryBreakdownItem, Balance, BudgetStatus } from '../types';

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
  budgetStatus: (params?: { month?: number; year?: number }) =>
    api.get<BudgetStatus>('/transactions/budget-status', { params }),
  uploadReceipt: (file: File) => {
    return new Promise<{ data: { blobName: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        api.post<{ blobName: string }>('/upload', {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          data: base64,
        }).then(resolve).catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  getReceiptUrl: (id: string) =>
    api.get<{ url: string }>(`/transactions/${id}/receipt-url`),
};
