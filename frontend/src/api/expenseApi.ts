import apiClient from "./axiosClient";
import type { Expense, Paginated } from "@/types";

export interface ExpenseQuery {
  page?: number;
  limit?: number;
  category?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: string;
}

export type ExpensePayload = {
  title: string;
  amount: number;
  date?: string;
  category: string;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
};

export const expenseApi = {
  list: (params?: ExpenseQuery) =>
    apiClient.get<{ success: boolean } & Paginated<Expense>>("/expenses", { params }),

  getById: (id: string) => apiClient.get<{ success: boolean; data: Expense }>(`/expenses/${id}`),

  create: (payload: ExpensePayload) =>
    apiClient.post<{ success: boolean; data: Expense }>("/expenses", payload),

  update: (id: string, payload: Partial<ExpensePayload>) =>
    apiClient.put<{ success: boolean; data: Expense }>(`/expenses/${id}`, payload),

  remove: (id: string) => apiClient.delete(`/expenses/${id}`),

  duplicate: (id: string) => apiClient.post<{ success: boolean; data: Expense }>(`/expenses/${id}/duplicate`),
};

export default expenseApi;
