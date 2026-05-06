export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  userId: string;
  categoryId: string | null;
  category: CategorySummary | null;
  receiptBlobName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

export interface Summary {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
}

export interface Balance {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

export interface BudgetStatus {
  month: number;
  year: number;
  totalExpenses: number;
  monthlyLimit: number;
  exceeded: boolean;
  percentage: number;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  date: string;
  description: string | null;
  receiptBlobName?: string | null;
}
